'use strict';

const axon = require('axon');
const logger = require('../utils/logger');

function RoomSlave(namespace) {
	namespace.slave = {
		sock: axon.socket('pull')
	};

	namespace.slave.connect = function (port, host) {
		namespace.slave.sock.connect(port, host);
		logger.info('Connected room slave to MQ master');
	};

	namespace.slave.sock.on('message', (type, event, doc) => {
		if (type === 'room') {
			switch (event) {
				case 'create':
					logger.debug('Got notified of room creation by master');
					namespace.createChannel(doc);
					break;
				case 'delete':
					logger.debug('Got notified of room deletion by master');
					namespace.deleteChannel(doc);
					break;
				default:
					logger.error('Unrecognized notified event by master');
					break;
			}
		}
	});
}

module.exports = RoomSlave;
