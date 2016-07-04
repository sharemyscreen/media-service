'use strict';

const _ = require('lodash');
const kurento = require('kurento-client');
const {organizationModel} = require('sharemyscreen-common');
const logger = require('../utils/logger');
const config = require('../utils/config');

const {KurentoClient} = kurento;

function Channel(namespace) {
	namespace.channels = {};
	namespace.sessions = {};

	namespace.getOrganization = function (done) {
		organizationModel.findOne({_id: namespace.doc})
		.populate('rooms rooms.members')
		.exec(done);
	};

	namespace.createChannel = function (room, done) {
		logger.info('Im in createChanell');
		namespace.getKurentoClient((err, kurentoClient) => {
			if (err) {
				return done(err);
			}
			logger.info('Got kurento client');

			kurentoClient.create('MediaPipeline', (err, pipeline) => {
				if (err) {
					return done(err);
				}
				logger.info(`Created MediaPipeline for the channel: ${room.publicId}`);

				const channel = namespace.channels[room.publicId] = {
					pipeline,
					doc: room,
					members: []
				};
				logger.info(`Created channel: ${room.publicId}`);

				_.each(namespace.sessions, (userId, socket) => {
					logger.info(`Session: ${userId}:${socket}`);
				});

				logger.info(`Room members: ${JSON.stringify(room.members)}`);
				_.each(room.members, member => {
					const socket = namespace.sessions[member.publicId];

					logger.info(`Session socket: ${socket}`);
					if (socket) {
						namespace.addUserToChannel(room, socket, err => {
							if (err) {
								return done(err);
							}
						});
					}
				});

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

	namespace.addUserToChannel = function (roomPublicId, socket, done) {
		const channel = namespace.channels[roomPublicId];

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

				socket.emit('user_scope', {
					cmd: 'ice_candidate',
					session_id: socket.id,
					candidate
				});
			});

			socket.emit('user_scope', {
				cmd: 'invited',
				room_id: channel.doc.publicId
			});

			// Notify other room members of the new user
			namespace.in(channel.doc.publicId).emit('room_scope', {
				cmd: 'user_joined',
				user_id: socket.client.user.publicId,
				room_id: channel.doc.publicId
			});

			// Subscribe the new user to the channel
			socket.join(channel.doc.publicId);
			channel.members.push(socket);
		});
	};

	namespace.removeUserFromChannel = function (roomPublicId, socket, done) {
		const channel = namespace.channels[roomPublicId];

		if (!_.includes(channel.members, socket)) {
			return done();
		}

		_.pull(channel.members, socket);
		socket.leave(channel.doc.publicId);

		if (socket.client.outgoingMedia) {
			socket.client.outgoingMedia.release();
			logger.debug(`Released outgoing media for socket: ${socket.id}`);
		}

		if (socket.client.incomingMedia) {
			_.each(socket.client.incomingMedia, incomingMedia => {
				incomingMedia.release();
				_.pull(socket.client.incomingMedia, incomingMedia);
			});
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
			user_id: socket.client.user.publicId,
			room_id: channel.doc.publicId
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

	namespace.createChannelsFromDb = function (done) {
		namespace.getOrganization((err, org) => {
			if (err) {
				return done(err);
			}

			logger.info(`createChannelsFromDb: ${org}`);

			_.each(org.rooms, room => {
				namespace.createChannel(room, err => {
					if (err) {
						return done(err);
					}
				});
			});
			done();
		});
	};

	namespace.createChannelsFromDb(err => {
		if (err) {
			throw err;
		}
	});
}

module.exports = Channel;
