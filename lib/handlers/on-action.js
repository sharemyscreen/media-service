'use strict';

const _ = require('lodash');
const async = require('async');
const {roomModel, userModel} = require('sharemyscreen-common');
const logger = require('../utils/logger');

function actionHandler(nsp, socket) {
	function _getUserIdFromPublicId(userPublicIds, done) {
		userModel.where('publicId').in(_.castArray(userPublicIds)).exec((err, users) => {
			if (err) {
				return done(err);
			}

			logger.info(`getUserIdFomPublicId: input ${userPublicIds}, res: ${users}`);
			done(null, _.isArray(userPublicIds) ? users : users[0]);
		});
	}

	function _createRoom(data) {
		async.waterfall([
			nsp.getOrganization,
			function (org, done) {
				console.log('here');
				_getUserIdFromPublicId(data.users_id, (err, users) => {
					if (err) {
						return done(err);
					}
					roomModel.createNew(
						data.name,
						socket.client.user,
						users,
						(err, room) => {
							if (err) {
								return done(err);
							}
							org.rooms.push(room);
							org.save(err => {
								if (err) {
									return done(err);
								}
								done(null, room);
							});
						});
				});
			},
			function (room, done) {
				console.log('here2');
				nsp.createChannel(room, err => {
					if (err) {
						return done(err);
					}
					done(null, room);
				});
			}
		], (err, room) => {
			console.log('here3');
			if (err) {
				throw err;
			}

			nsp.emit('user_scope', {
				cmd: 'invited',
				user_id: socket.client.user.publicId,
				room_id: room.publicId
			});
		});
	}

	return function (action) {
		logger.info(`New action received on the socket: ${socket.id}`);
		logger.info(`Action: ${action.cmd}`);
		logger.info(`Action Details: ${JSON.stringify(action)}`);

		logger.info(`Socket Rooms: ${JSON.stringify(socket.rooms)}`);

		let res;
		switch (action.cmd) {
			case 'send_message':
				res = {
					cmd: 'user_message',
					user_id: socket.client.user.publicId,
					room_id: action.room_id,
					content: action.content
				};

				// nsp.emit('room_scope', res);
				nsp.emit('room_scope', res);
				logger.info(`Sent to socket: ${JSON.stringify(res, null, 2)}`);
				break;
			case 'start_call':
				nsp.emit('room_scope', {
					cmd: 'user_call_started',
					user_id: socket.client.user.publicId,
					room_id: action.room_id
				});
				break;
			case 'accept_call':
				nsp.emit('room_scope', {
					cmd: 'user_call_accepted',
					user_id: socket.client.user.publicId,
					room_id: action.room_id
				});
				break;
			case 'reject_call':
				nsp.emit('room_scope', {
					cmd: 'user_call_rejected',
					user_id: socket.client.user.publicId,
					room_id: action.room_id
				});
				break;
			case 'list_rooms':
				socket.emit('user_scope', {
					cmd: 'room_list',
					rooms: nsp.channels
				});
				break;
			case 'invite_user':
				action.user_id = _.castArray(action.user_id);
				_.each(action.user_id, userId => {
					if (nsp.sessions[userId]) {
						nsp.addUserToChannel(action.room_id, nsp.sessions[userId]);
					}
				});
				break;
			case 'kick_user':
				action.user_id = _.castArray(action.user_id);
				_.each(action.user_id, userId => {
					if (nsp.sessions[userId]) {
						nsp.removeUserFromChannel(action.room_id, nsp.sessions[userId]);
					}
				});
				break;
			case 'create_room':
				_createRoom(action);
				break;
			default:
				break;
		}
	};
}

module.exports = actionHandler;
