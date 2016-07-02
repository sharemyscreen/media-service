'use strict';

const axon = require('axon');
const config = require('../utils/config');
const logger = require('../utils/logger');

function Slave(server) {
	server.slave = {
		sock: axon.socket('pull')
	};

	server.slave.connect = function (port, host) {
		server.slave.sock.connect(port, host);
		logger.info('Connected organization slave to MQ master');
	};

	server.slave.sock.on('message', (type, event, doc) => {
		if (type === 'organization') {
			switch (event) {
				case 'create':
					logger.debug('Got notified of organization creation by master');
					server.createNamespace(doc);
					break;
				case 'delete':
					logger.debug('Got notified of organization deletion by master');
					server.deleteNamespace(doc);
					break;
				default:
					logger.error('Unrecognized notified event by master');
					break;
			}
		}
	});

	server.slave.connect(config.mqMasterUri);
}

module.exports = Slave;
