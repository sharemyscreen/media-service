'use strict';

const kurento = require('kurento-client');
const logger = require('../utils/logger');
const {config} = require('../../package.json');

const {KurentoClient} = kurento;

function Channel(namespace) {
	namespace.channels = {};

	namespace.createChannel = function (room, done) {
		namespace.getKurentoClient((err, kurentoClient) => {
			if (err) {
				return done(err);
			}
			logger.debug('Got kurento client');

			kurentoClient.create('MediaPipeline', (err, pipeline) => {
				if (err) {
					return done(err);
				}
				logger.debug(`Created MediaPipeline for the channel: ${room.publicId}`);

				const channel = namespace.channels[room.publicId] = {
					pipeline,
					doc: room,
					members: []
				};
				logger.info(`Created channel: ${room.publicId}`);

				done(null, channel);
			});
		});
	};

	namespace.getChannel = function (room, done) {
		if (namespace.channels[room.publicId]) {
			logger.info(`Got existing channel: ${room.publicId}`);

			return done(null, namespace.channels[room.publicId]);
		}

		namespace.createChannel(room, done);
	};

	namespace.addUserToChannel = function (channel, socket, done) {
		channel.pipeline.create('WebRtcEndpoint', (err, outgoingMedia) => {
			if (err) {
				if (channel.members.length === 0) {
					channel.pipeline.release();
				}
				return done(err);
			}

			outgoingMedia.setMaxVideoSendBandwidth(30);
			outgoingMedia.setMinVideoSendBandwidth(20);
			socket.client.outgoingMedia = outgoingMedia;

			const iceCandidateQueue = socket.client.iceCandidateQueue[socket.id];

			if (iceCandidateQueue) {
				while (iceCandidateQueue.length) {
					const message = iceCandidateQueue.shift();

					logger.debug(`User: ${socket.id} collects candidate for outgoing media`);
					socket.client.outgoingMedia.addIceCandidate(message.candidate);
				}
			}

			socket.client.outgoingMedia.on('OnIceCandidate', event => {
				logger.debug(`Created outgoing candidate: ${socket.id}`);

				const candidate = kurento.register.complexTypes.IceCandidate(event.candidate);

				socket.emit('message', {
					id: 'iceCandidate',
					session_id: socket.id,
					candidate
				});
			});

			// Notify other room members of the new user
			namespace.in(channel.doc.publicId).emit('room_scope', {
				cmd: 'user_joined',
				user_id: socket.id,
				room_id: channel.doc.publicId
			});

			// Subscribe the new user to the channel
			socket.join(channel.doc.publicId);
			channel.members.push(socket);

			// Add user to the room model in db
			channel.doc.inviteUser(socket.client.user, err => {
				if (err) {
					return done(err);
				}

				done();
			});
		});
	};

	namespace.removeUserFromChannel = function (channel, socket, done) {
		if (channel.members.indexOf(socket) === -1) {
			return done();
		}

		channel.members.splice(channel.members.indexOf(socket), 1);
		socket.leave(channel.doc.publicId);

		if (socket.client.outgoingMedia) {
			socket.client.outgoingMedia.release();
			logger.debug(`Released outgoing media for socket: ${socket.id}`);
		}

		if (socket.client.incomingMedia) {
			for (const i in socket.client.incomingMedia) {
				if ({}.hasOwnProperty.call(socket.client.incomingMedia, i)) {
					socket.client.incomingMedia[i].release();
					delete socket.client.incomingMedia[i];
				}
			}
			logger.debug(`Released incoming medias for socket: ${socket.id}`);
		}

		for (let i = 0; i < channel.members; i++) {
			const memberSocket = channel.members[i];

			if (memberSocket.client.incomingMedia) {
				memberSocket.client.incomingMedia[socket.id].release();
				delete memberSocket.client.incomingMedia[socket.id];
			}
		}

		// Notify other room members of the left user
		namespace.in(channel.doc.publicId).emit('room_scope', {
			cmd: 'user_left',
			user_id: socket.id,
			room_id: channel.doc.publicId
		});

		// Remove user from channel room model
		channel.doc.kickUser(socket.client.user, err => {
			if (err) {
				return done(err);
			}

			done();
		});
	};

	namespace.getKurentoClient = function (done) {
		if (namespace.kurento) {
			return done(null, namespace.kurento);
		}

		KurentoClient.getSingleton(config.kurentoUri, (err, kurento) => {
			if (err) {
				return done(err);
			}

			namespace.kurento = kurento;
			done(null, kurento);
		});
	};

	namespace.createChannel(namespace.doc.room.default);

	require('./room-slave')(namespace);

	namespace.slave.connect(process.env.SMS_MQ_MASTER_URI || config.mqMasterUri);
}

module.exports = Channel;
