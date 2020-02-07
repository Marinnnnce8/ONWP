const gulp = require("gulp");
const fs = require("fs");
const runSequence = require("run-sequence");
const imagemin = require("gulp-imagemin");

/*----------------------------------------------------------------------------------------------
	Assets Files
 ----------------------------------------------------------------------------------------------*/
gulp.task("assets", function() {
  runSequence(
    "assets-img",
    "assets-fonts",
    "favicon-copy"
  );
});

// copy fonts
gulp.task("assets-fonts", function() {
  const distAssetsPath = "dist/fonts";
  const srcAssetsPath = "src/fonts";
  const distAssets = fs.existsSync(distAssetsPath)
    ? fs.readdirSync(distAssetsPath)
    : [];

  if (!fs.existsSync("dist/fonts")) {
    fs.mkdirSync("./dist/fonts");
  }

  if (fs.existsSync(srcAssetsPath)) {
    fs.readdirSync(srcAssetsPath).forEach(cur => {
      if (!distAssets.includes(cur)) {
        fs.copyFileSync(`${srcAssetsPath}/${cur}`, `${distAssetsPath}/${cur}`);
      }
    });
  }
});

gulp.task("assets-img", function(){
	gulp.src('src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'))
});

gulp.task("favicon-copy", function() {
  return gulp.src("src/favicon/**").pipe(gulp.dest("dist/favicon"));
});
