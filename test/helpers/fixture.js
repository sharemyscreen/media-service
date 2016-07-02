'use strict';

const _ = require('lodash');
const async = require('async');
const common = require('sharemyscreen-common');

const client = require('../fixtures/client.json');
const users = require('../fixtures/user.json');
const tokens = require('../fixtures/access-token.json');
const organizations = require('../fixtures/organization.json');

function Fixture(push) {
	const fixture = {};

	const _doneAssign = function (fixtureRes, done) {
		return function (err, res) {
			if (err) {
				return done(err);
			}

			fixture[fixtureRes] = res;

			done(null, fixture[fixtureRes]);
		};
	};

	fixture.createClient = function (done) {
		if (fixture.client) {
			return done();
		}

		common.clientModel.createNew(
			client[0].name, _doneAssign('client', done)
		);
	};

	fixture.createUsers = function (done) {
		if (fixture.users) {
			return done();
		}

		async.parallel(_.map(users, user => {
			return async.apply(
				common.userModel.createPassword,
				user.email, user.password,
				user.first_name, users.last_name
			);
		}), _doneAssign('users', done));
	};

	fixture.createAccessTokens = function (done) {
		if (fixture.tokens) {
			return done();
		}

		async.parallel([
			fixture.createClient,
			fixture.createUsers
		], err => {
			if (err) {
				return done(err);
			}

			async.parallel(_.map(tokens, token => {
				const i = tokens.indexOf(token);

				return async.apply(
					common.accessTokenModel.createNew,
					fixture.client, fixture.users[i]
				);
			}), _doneAssign('tokens', done));
		});
	};

	fixture.createOrganizations = function (done) {
		if (fixture.orgs) {
			return done();
		}

		fixture.createUsers(err => {
			if (err) {
				return done(err);
			}

			async.parallel(_.map(organizations, org => {
				const i = organizations.indexOf(org);

				return function (done) {
					common.organizationModel.createNew(org.name, fixture.users[i], (err, org) => {
						if (err) {
							return done(err);
						}

						push.notifyOrganizationCreation(org);
						done(null, org);
					});
				};
			}), _doneAssign('orgs', done));
		});
	};

	return fixture;
}

module.exports = Fixture;
