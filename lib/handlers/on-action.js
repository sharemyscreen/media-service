'use strict';

const _ = require('lodash');
const logger = require('../utils/logger');

function actionHandler(nsp, socket) {
	return function (action) {
		logger.info(`New action received on the socket: ${socket.id}`);
		logger.debug(`Action: ${action.id}`);

		switch (action.cmd) {
			case 'send_message':
				actionin(action.room_id).emit('room_scope', {
					cmd: 'user_message',
					user_id: socket.id,
					room_id: action.room_id,
					content: action.content
				});
				break;
			case 'start_call':
				actionin(action.room_id).emit('room_scope', {
					cmd: 'user_call_started',
					user_id: socket.id,
					room_id: action.room_id
				});
				break;
			case 'accept_call':
				actionin(action.room_id).emit('room_scope', {
					cmd: 'user_call_accepted',
					user_id: socket.id,
					room_id: action.room_id
				});
				break;
			case 'reject_call':
				actionin(action.room_id).emit('room_scope', {
					cmd: 'user_call_rejected',
					user_id: socket.id,
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
				_.forEach(action.user_id, user_id => {
					nsp.getSocketByUserId(user_id).emit('user_scope', {
						cmd: 'invited',
						user_id: socket.id,
						room_id: action.room_id
					});
				});
				break;
			case 'kick_user':
				_.forEach(action.user_id, user_id => {
					nsp.getSocketByUserId(user_id).emit('user_scope', {
						cmd: 'kicked',
						user_id: socket.id,
						room_id: action.room_id
					});
				});
				break;
			default:
				break;
		}
	};
}

module.exports = actionHandler;
