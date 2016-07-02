'use strict';

const axon = require('axon');

function Master() {
	const master = {
		sock: axon.socket('push')
	};

	master.bind = function (port, host) {
		master.sock.bind(port, host);
	};

	master.notifyOrganizationCreation = function (org) {
		master.sock.send('organization', 'create', org);
	};

	master.notifyOrganizationDeletion = function (org) {
		master.sock.send('organization', 'delete', org);
	};

	return master;
}

module.exports = Master;
