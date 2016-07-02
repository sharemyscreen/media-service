'use strict';

const {accessTokenModel} = require('sharemyscreen-common');

function authenticate(socket, next) {
	const accessToken = socket.request._query.token;

	console.log(accessToken);
	if (!accessToken) {
		return next(new Error('Unauthorized'));
	}

	accessTokenModel.findOne({token: accessToken}).exec((err, token) => {
		if (err || !token) {
			return next(new Error('Unauthorized'));
		}

		require('../mixins/session')(socket);

		next();
	});
}

module.exports = authenticate;
