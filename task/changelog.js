'use strict';

const fs = require('fs');
const gulp = require('gulp');
const changelog = require('gulp-changelogmd');

gulp.task('changelog', () => {
	const pkg = JSON.parse(fs.readFileSync('./package.json'));

	return gulp.src('./CHANGELOG.md')
		.pipe(changelog(pkg.version))
		.pipe(gulp.dest('./'));
});
