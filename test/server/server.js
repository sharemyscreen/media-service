'use strict';

const {expect} = require('chai');
const {fixture, io} = require('../helpers/context');

let init = false;
let socket;
const opts = {
	// reconnection: false,
	// forceNew: true
};

function connectSocket(uri) {
	if (init) {
		socket.socket.connect(uri, opts);
	} else {
		socket = io.connect(uri, opts);
		init = true;
	}
}

describe('Server', () => {
	before(fixture.createAccessTokens);
	before(fixture.createOrganizations);

	/*
	it('should disconnect socket on global namespace', done => {
		const socket = io.connect(`${io.url}/`);

		socket.on('disconnect', () => {
			done();
		});

		socket.close();
	});
	*/

	it('should emit unauthorized with no credentials', done => {
		connectSocket(`${io.url}/${fixture.orgs[0].publicId}`);

		socket.on('unauthorized', () => {
			done();
		});
	});

	it('should emit authenticated with credentials', done => {
		connectSocket(`${io.url}/${fixture.orgs[0].publicId}`);

		socket.emit('authenticate', {access_token: fixture.tokens[0].token});
		socket.on('authenticated', () => {
			console.log('lol');
			done();
		});
	});
});
