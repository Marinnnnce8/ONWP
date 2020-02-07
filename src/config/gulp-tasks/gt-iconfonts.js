const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const svgo = require('svgo');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');
const globalVars = require('./_global-vars');
const inputPath = __dirname;

/*----------------------------------------------------------------------------------------------
	SVGs / IconFont
----------------------------------------------------------------------------------------------*/
gulp.task('iconfont', () => {
	return gulp.src(['src/svg/*.svg'])
		.pipe(iconfontCss({
			fontName: 'svgicons',
			cssClass: 'font',
			path: 'src/config/icon-font.scss',
			targetPath: '../scss/layout/_icon-font.scss',
			fontPath: '../fonts/'
		}))
		.pipe(iconfont({
			fontName: 'svgicons', // required
			prependUnicode: false, // recommended option
			formats: ['ttf', 'woff', 'woff2'], // default, 'woff2' and 'svg' are available
			normalize: true,
			centerHorizontally: true
		}))
		.on('glyphs', (glyphs, options) => {
			// CSS templating, e.g.
			console.log(glyphs, options);
		})
		.pipe(gulp.dest('src/fonts/'));
});