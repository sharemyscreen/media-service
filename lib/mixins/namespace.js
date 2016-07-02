'use strict';

const {organizationModel} = require('sharemyscreen-common');
const logger = require('../utils/logger');
const connectionHandler = require('../handlers/on-connection');

/**
* Namespaceable - namespaces mixin for media server
* @param  {Server} server Media Server
*/
function Namespace(server) {
	server.namespaces = {};

	/**
	* createNamespace - create a socket.io namespace from an organization document
	* @param  {Organization} org organization document
	*/
	server.createNamespace = function (org) {
		const nspPath = `/${org.publicId}`;
		const nsp = server.io.of(nspPath);

		nsp.doc = org;

		require('./channel')(nsp);

		nsp.on('connection', connectionHandler(nsp));
		server.namespaces[nspPath] = nsp;

		logger.info(`Created namespace: ${nspPath}`);
	};

	server.deleteNamespace = function (org) {
		const nspPath = `/${org.publicId}`;
		const nsp = server.io.of(nspPath);

		for (const socketId in nsp.connected) {
			if ({}.hasOwnProperty.call(nsp.connected, socketId)) {
				nsp.connected[socketId].disconnect();
			}
		}

		nsp.removeAllListeners();
		delete server.io.nsps[nspPath];
		delete server.namespaces[nspPath];

		logger.info(`Deleted namespace: ${nspPath}`);
	};

	server.createNamespacesFromDb = function (done) {
		organizationModel.find().exec((err, orgs) => {
			if (err) {
				return done(err);
			}

			orgs.forEach(server.createNamespace);
			done();
		});
	};

	require('./slave')(server);
}

module.exports = Namespace;
