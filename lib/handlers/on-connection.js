'use strict';

const logger = require('../utils/logger');
const actionHandler = require('./on-action');

function connectionHandler(nsp) {
	return function (socket) {
		logger.info(`New socket connected to the media service: ${socket.id}`);

		// Notify other namespace members of the connected user
		nsp.emit('namespace_scope', {
			cmd: 'user_connected', // nsp.emit('id', socket.id);
			user_id: socket.client.user.id
		});

		nsp.addUserToChannel(nsp.doc.room.default, socket);

		socket.on('error', data => {
			logger.info(`Connection ${socket.id}: error: ${data}`);
			socket.rooms.forEach(channelId => {
				nsp.removeUserFromChannel(nsp.channels[channelId], socket, err => {
					if (err) {
						throw err;
					}
				});
			});
			socket.disconnect();
		});

		socket.on('disconnect', data => {
			logger.info(`Connection ${socket.id}: disconnect: ${data}`);

			// Notify other namespace members of the disconnected user
			nsp.emit('namespace_scope', {
				cmd: 'user_disconnected',
				user_id: socket.client.user.id
			});

			// Send roomlist to the new namespace members
			socket.emit('user_scope', {
				cmd: 'room_list',
				rooms: nsp.channels
			});

			socket.rooms.forEach(channelId => {
				nsp.removeUserFromChannel(nsp.channels[channelId], socket, err => {
					if (err) {
						throw err;
					}
				});
			});
		});

		socket.on('action', actionHandler(nsp, socket));
	};
}

module.exports = connectionHandler;
