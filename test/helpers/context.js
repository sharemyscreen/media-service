'use strict';

function Context() {
	const context = {
		config: require('../../package.json').config.test,
		push: require('./master')(),
		io: require('socket.io-client')
	};

	context.io.url = `ws://localhost:${context.config.port}`;
	context.push.bind(7777);

	context.fixture = require('./fixture')(context.push);

	return context;
}

module.exports = Context();
