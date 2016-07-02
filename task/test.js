'use strict';

const gulp = require('gulp');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const env = require('gulp-env');

gulp.task('pretest', () => {
	return gulp.src('lib/**/*.js')
		.pipe(istanbul({includeUntested: true}))
		.pipe(istanbul.hookRequire());
});

gulp.task('test', ['pretest'], () => {
	return gulp.src('test/test.js')
		.pipe(env.set({NODE_ENV: 'test'}))
		.pipe(mocha({reporter: 'spec'}))
		.pipe(istanbul.writeReports())
		.pipe(istanbul.enforceThresholds({thresholds: {global: 90}}));
});
