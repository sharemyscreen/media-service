'use strict';

const logger = require('../utils/logger');

function messageHandler(nsp, socket) {
	return function (message) {
		logger.info(`New message received on the socket: ${socket.id}`);
		logger.debug(`Message: ${message.id}`);
	};
}

module.exports = messageHandler;
