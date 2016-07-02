'use strict';

const pkgConfig = require('../../package.json').config;

const localConfig = pkgConfig[process.env.NODE_ENV || 'development'];

const config = {
	port: process.env.SMS_MEDIA_PORT || localConfig.port,
	mqMasterUri: process.env.SMS_MQ_MASTER_URI || localConfig.mqMasterUri,
	mongoUri: process.env.SMS_MONGO_URI || localConfig.mongoUri,
	kurentoUri: process.env.SMS_KURENTO_URI || localConfig.kurentoUri
};

module.exports = config;
