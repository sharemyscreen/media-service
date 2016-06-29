'use strict';

const logger = require('../utils/logger');
const messageHandler = require('./on-message');

function connectionHandler(nsp) {
	return function (socket) {
		logger.info(`New socket connected to the media service: ${socket.id}`);

		nsp.emit('id', socket.id);
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
			socket.rooms.forEach(channelId => {
				nsp.removeUserFromChannel(nsp.channels[channelId], socket, err => {
					if (err) {
						throw err;
					}
				});
			});
		});

		socket.on('message', messageHandler(nsp, socket));
	};
}

module.exports = connectionHandler;
