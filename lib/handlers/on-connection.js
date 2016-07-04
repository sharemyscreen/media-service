'use strict';

const _ = require('lodash');
const {accessTokenModel} = require('sharemyscreen-common');
const logger = require('../utils/logger');
const actionHandler = require('./on-action');

function connectionHandler(nsp) {
	return function (socket) {
		logger.info(`New socket connected to the media service: ${socket.id}`);

		socket.auth = false;
		socket.on('authenticate', data => {
			const accessToken = data.access_token;

			console.log(accessToken);

			accessTokenModel.findOne({token: accessToken}).populate('user').exec((err, token) => {
				if (!err && token) {
					require('../mixins/session')(socket, token.user);

					if (nsp.sessions[token.user.publicId]) {
						nsp.sessions[token.user.publicId].disconnect();
					}
					nsp.sessions[token.user.publicId] = socket;

					socket.auth = true;
					socket.emit('authenticated');

					// Notify other namespace members of the connected user
					nsp.emit('namespace_scope', {
						cmd: 'user_connected', // nsp.emit('id', socket.id);
						user_id: socket.client.user.publicId
					});

					nsp.getOrganization((err, org) => {
						if (err) {
							socket.auth = false;
							return;
						}

						nsp.addUserToChannel(org.rooms[0], socket);
						socket.on('action', actionHandler(nsp, socket));
					});
				}
			});
		});

		setTimeout(() => {
			if (!socket.auth) {
				socket.emit('unauthorized');
				socket.disconnect();
				logger.warn('Disconnected unauthorized socket');
			}
		}, 1000);

		socket.on('error', data => {
			logger.info(`Connection ${socket.id}: error: ${data}`);
			_.each(socket.rooms, channelId => {
				nsp.removeUserFromChannel(channelId, socket, err => {
					if (err) {
						throw err;
					}
				});
			});
			socket.disconnect();
		});

		socket.on('disconnect', data => {
			logger.info(`Connection ${socket.id}: disconnect: ${data}`);

			if (socket.auth) {
				// Notify other namespace members of the disconnected user
				nsp.emit('namespace_scope', {
					cmd: 'user_disconnected',
					user_id: socket.client.user.publicId
				});
			}

			_.each(socket.rooms, channelId => {
				if (nsp.channels[channelId]) {
					nsp.removeUserFromChannel(channelId, socket, err => {
						if (err) {
							throw err;
						}
					});
				}
			});
		});
	};
}

module.exports = connectionHandler;
