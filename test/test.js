'use strict';

const mongoose = require('mongoose');
const requireDir = require('require-dir');

const config = require('../lib/utils/config');
const server = require('../lib/server').createServer();

require('./helpers/master').bind(config.mqMasterUri);

before(done => {
	mongoose.connection.on('error', err => {
		console.error('Unable to connect to the database ...');
		console.error(err);
		done(err);
	});

	mongoose.connection.on('open', () => {
		console.log('Connected to mongodb service');

		mongoose.connection.db.dropDatabase(err => {
			if (err) {
				return done(err);
			}

			console.log('Dropped test database');

			server.listen(config.port);
			done();
		});
	});

	mongoose.connect(config.mongoUri);
});

describe('Media Service', () => {
	requireDir('./server');
});
