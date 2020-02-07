const gulp = require('gulp');
const clean = require('gulp-clean');


// delete all html files from dist
gulp.task('html-clean', function () {
	return gulp.src('dist/**/*.html', {read: false})
		.pipe(clean());
});

gulp.task('html', function(){
    return gulp.src('src/*.html')
      .pipe(gulp.dest('dist/'));
});