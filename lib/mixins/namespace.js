'use strict';

const _ = require('lodash');
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

		nsp.doc = org._id;

		require('./channel')(nsp);

		nsp.on('connection', connectionHandler(nsp));
		server.namespaces[nspPath] = nsp;

		logger.info(`Created namespace: ${nspPath}`);
	};

	server.deleteNamespace = function (org) {
		const nspPath = `/${org.publicId}`;
		const nsp = server.io.of(nspPath);

		console.log(nsp.connected);
		_.each(nsp.connected, socket => {
			socket.disconnect();
		});

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
