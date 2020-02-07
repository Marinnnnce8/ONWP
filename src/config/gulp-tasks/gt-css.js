const gulp = require('gulp');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const sassLint = require('gulp-sass-lint');
const flexBugsFix = require('postcss-flexbugs-fixes');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('autoprefixer');
const rename = require('gulp-rename');
const globalVars = require('./_global-vars');

/*----------------------------------------------------------------------------------------------
	SCSS
 ----------------------------------------------------------------------------------------------*/
const plumberErrorHandler = {
	errorHandler: notify.onError({
		title: 'There was some Error, I think...',
		message: 'Error message: <%= error.message %>'
	})
};

// compile scss files
gulp.task('css', function () {
	const processors = [
		autoprefixer(),
		flexBugsFix
	];

	return gulp.src(['src/scss/*.scss'])
		.pipe(plumber(plumberErrorHandler))
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: globalVars.productionBuild ? 'compressed' : 'expanded'}))
		.pipe(postcss(processors))
		.pipe(rename('theme.min.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist/css'));
});

gulp.task('css-copy', function(){
    return gulp.src('src/css/*.css')
	.pipe(gulp.dest('dist/css'));
});

gulp.task('sasslint', function () {
	return gulp.src(['src/scss/**/*.scss', 'src/html/**/**/*.scss'])
		.pipe(sassLint({
			config: '.sass-lint.yml'
		}))
		.pipe(sassLint.format())
		.pipe(sassLint.failOnError());
});
