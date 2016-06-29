'use strict';

const gulp = require('gulp');
const xo = require('gulp-xo');

gulp.task('lint', () => {
	return gulp.src(['./**/*.js', '!./node_modules/**/*'])
		.pipe(xo());
});
