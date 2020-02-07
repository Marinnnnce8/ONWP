const gulp = require('gulp');
const	path = require('path');
const	fs = require('fs');
const	globalVars = require('./_global-vars');

/*----------------------------------------------------------------------------------------------
	Watch
 ----------------------------------------------------------------------------------------------*/
gulp.task('watch', function() {
	// watch .scss files
	gulp.watch(['src/scss/**/*.scss', 'src/html/**/**/*.scss'], ['css', 'sasslint']);

	// watch .js files
	// gulp.watch('src/js/**/*.js', ['js']);

	// watch .html files
	gulp.watch('src/*.html', ['html']);
});
