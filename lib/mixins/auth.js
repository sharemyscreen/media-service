'use strict';

const {accessTokenModel} = require('sharemyscreen-common');

function Authentication(server) {
	require('socketio-auth')(server.io, {
		authenticate(socket, data, done) {
			const accessToken = data.access_token;

			if (!accessToken) {
				return done(null, false);
			}

			accessTokenModel.findOne({token: accessToken}).exec((err, token) => {
				if (err) {
					return done(err);
				}

				done(null, Boolean(token));
			});
		},
		postAuthenticate(socket, data) {
			const accessToken = data.access_token;

			accessTokenModel.findOne({token: accessToken}).populate('user').exec((err, token) => {
				if (err) {
					throw err;
				}

				require('./session')(socket, token.user);
			});
		}
	});
}

module.exports = Authentication;
