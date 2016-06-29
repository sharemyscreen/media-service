'use strict';

const winston = require('winston');

const logger = new winston.Logger({
	transports: [
		new winston.transports.Console({level: 'info'}),
		new winston.transports.File({
			filename: 'media-service.log',
			level: 'verbose',
			tailable: true
		})
	],
	exceptionHandlers: [
		new winston.transports.File({
			filename: 'media-service-error.log',
			handleExceptions: true,
			humanReadableUnhandledException: true,
			tailable: true
		})
	]
});

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
	logger.transports.console.level = 'debug';
}

module.exports = logger;
