'use strict';

const mongoose = require('mongoose');

const config = require('./lib/utils/config');
const logger = require('./lib/utils/logger');
const server = require('./lib/server').createServer();

mongoose.connection.on('error', err => {
	logger.error('Unable to connect to mongodb service');
	logger.error(err);
	throw err;
});

mongoose.connection.on('open', () => {
	logger.info('Connected to mongodb service');

	server.createNamespacesFromDb(err => {
		if (err) {
			logger.error('Unable to create namespaces for existing organizations');
			logger.error(err);
			throw err;
		}
		server.listen(config.port);
	});
});

mongoose.connect(config.mongoUri);
