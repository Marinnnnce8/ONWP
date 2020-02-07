const gulp = require("gulp");
const plumber = require("gulp-plumber");
const uglify = require("gulp-uglify-es").default;
const rename = require("gulp-rename");
const runSequence = require("run-sequence");
const eslint = require("gulp-eslint");
const webpack = require("gulp-webpack");
const webpackConfig = require("../../../webpack.config");
const gulpif = require("gulp-if");
const globalVars = require("./_global-vars");

const destinationFolder = "dist/js";

/*----------------------------------------------------------------------------------------------
	JS
 ----------------------------------------------------------------------------------------------*/
// task: build javascript
gulp.task("js-task", function() {
	return gulp
		.src("src/js/**.js")
		.pipe(plumber())
		.pipe(webpack(webpackConfig))
		.pipe(gulpif(globalVars.productionBuild, uglify()))
		.pipe(rename([{ basename: "nb" , suffix: ".min"}, { basename: "theme" , suffix: ".min"}]))
		.pipe(gulp.dest(destinationFolder));
});

gulp.task('js-copy', function(){
    return gulp.src(['src/js/*.js', '!src/js/theme.js', '!src/js/nb.js'])
	.pipe(gulp.dest(destinationFolder));
});

gulp.task("js", function() {
	runSequence("js-copy", "js-task", () => false);
});
