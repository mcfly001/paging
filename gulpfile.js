/**
 * Created by zyj on 2016/12/14.
 */
var gulp=require('gulp'),
    sass=require('gulp-sass'),
    minicss=require('gulp-clean-css'),
    rename=require('gulp-rename');

//sass
gulp.task('sass',function(){
   return gulp.src('fw-module/scss/*.scss')
           .pipe(sass())
           .pipe(gulp.dest('fw-module/css'))
});

//watch
gulp.task('watch',function(){
   return gulp.watch('./fw-module/scss/*.scss',gulp.series('sass'));
});