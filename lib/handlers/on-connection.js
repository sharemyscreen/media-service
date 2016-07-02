'use strict';

const _ = require('lodash');
const {accessTokenModel} = require('sharemyscreen-common');
const logger = require('../utils/logger');
const messageHandler = require('./on-message');

function connectionHandler(nsp) {
	return function (socket) {
		logger.info(`New socket connected to the media service: ${socket.id}`);

		socket.auth = false;
		socket.on('authenticate', data => {
			const accessToken = data.access_token;

			console.log(accessToken);

			accessTokenModel.findOne({token: accessToken}).exec((err, token) => {
				if (!err && token) {
					require('../mixins/session')(socket);

					socket.auth = true;
					socket.emit('authenticated');
				}
			});
		});

		setTimeout(() => {
			if (!socket.auth) {
				socket.emit('unauthorized');
				socket.disconnect('unauthorized');
			}
		}, 1000);

		nsp.emit('id', socket.id);
		// nsp.addUserToChannel(nsp.doc.room.default, socket);

		socket.on('error', data => {
			logger.info(`Connection ${socket.id}: error: ${data}`);
			socket.rooms.forEach(channelId => {
				nsp.removeUserFromChannel(nsp.channels[channelId], socket, err => {
					if (err) {
						throw err;
					}
				});
			});
			socket.disconnect();
		});

		socket.on('disconnect', data => {
			logger.info(`Connection ${socket.id}: disconnect: ${data}`);
			_.each(socket.rooms, channelId => {
				nsp.removeUserFromChannel(nsp.channels[channelId], socket, err => {
					if (err) {
						throw err;
					}
				});
			});
			socket.disconnect();
		});

		socket.on('message', messageHandler(nsp, socket));
	};
}

module.exports = connectionHandler;
