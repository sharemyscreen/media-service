'use strict';

const _ = require('lodash');
const async = require('async');
const {roomModel} = require('sharemyscreen-common');
const logger = require('../utils/logger');

function actionHandler(nsp, socket) {
	function _createRoom(data) {
		async.waterfall([
			nsp.getOrganization,
			function (org, done) {
				console.log('here');
				roomModel.createNew(
					data.name,
					socket.client.user,
					_.castArray(data.users_id),
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

			nsp.in(room.publicId).emit('user_scope', {
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

		switch (action.cmd) {
			case 'send_message':
				nsp.in(action.room_id).emit('room_scope', {
					cmd: 'user_message',
					user_id: socket.client.user.publicId,
					room_id: action.room_id,
					content: action.content
				});
				break;
			case 'start_call':
				nsp.in(action.room_id).emit('room_scope', {
					cmd: 'user_call_started',
					user_id: socket.client.user.publicId,
					room_id: action.room_id
				});
				break;
			case 'accept_call':
				nsp.in(action.room_id).emit('room_scope', {
					cmd: 'user_call_accepted',
					user_id: socket.client.user.publicId,
					room_id: action.room_id
				});
				break;
			case 'reject_call':
				nsp.in(action.room_id).emit('room_scope', {
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
				_.forEach(action.user_id, userId => {
					nsp.sessions[userId].emit('user_scope', {
						cmd: 'invited',
						user_id: socket.client.user.publicId,
						room_id: action.room_id
					});
				});
				break;
			case 'kick_user':
				_.forEach(action.user_id, userId => {
					nsp.sessions[userId].emit('user_scope', {
						cmd: 'kicked',
						user_id: socket.client.user.publicId,
						room_id: action.room_id
					});
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
