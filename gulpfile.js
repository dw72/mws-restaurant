var gulp = require('gulp')
var del = require('del')
var $ = require('gulp-load-plugins')()

gulp.task('clean', function() {
  return del(['img'])
})

gulp.task('images', function() {
  return gulp
    .src('img_src/*.jpg')
    .pipe(
      $.responsive(
        {
          '*': [
            {
              width: 320,
              rename: {
                suffix: '-320px'
              }
            },
            {
              width: 440,
              rename: {
                suffix: '-440px'
              }
            },
            {
              width: 570,
              rename: {
                suffix: '-570px'
              }
            },
            {
              width: 740,
              rename: {
                suffix: '-740px'
              }
            },
            {
              width: 820,
              withoutEnlargement: false,
              rename: {
                suffix: '-820px'
              }
            }
          ]
        },
        {
          quality: 70,
          progressive: true,
          withMetadata: false
        }
      )
    )
    .pipe(gulp.dest('img'))
})

gulp.task('default', ['clean', 'images'])
