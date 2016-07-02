'use strict';

const logger = require('./utils/logger');

function Server() {
	const server = {
		io: require('socket.io')()
	};

	/**
	 * listen - start listening on given port
	 * @param  {number} port port to listen on
	 */
	server.listen = function (port) {
		server.io.listen(port);

		logger.info(`Listening on ${port}`);
	};

	require('./mixins/namespace')(server);

	/*
	server.io.on('connection', socket => {
		logger.warn(`Connected socket on global namespace: ${socket.id}`);
		socket.disconnect();
		logger.info('Disconnected socket from global namespace');
	});
	*/

	return server;
}

module.exports = Server.createServer = Server;
