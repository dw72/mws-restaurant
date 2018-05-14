var gulp = require('gulp')
var del = require('del')
var $ = require('gulp-load-plugins')()

gulp.task('clean', function() {
  return del(['img'])
})

gulp.task('images', function() {
  return gulp
    .src('img_src/*.{jpg,png}')
    .pipe(
      $.responsive({
        'launcher.png': [
          {
            width: 48,
            rename: {
              dirname: 'icons',
              suffix: '-icon-48px'
            }
          },
          {
            width: 96,
            rename: {
              dirname: 'icons',
              suffix: '-icon-96px'
            }
          },
          {
            width: 192,
            rename: {
              dirname: 'icons',
              suffix: '-icon-192px'
            }
          },
          {
            width: 512,
            rename: {
              dirname: 'icons',
              suffix: '-icon-512px'
            }
          }
        ],
        '*.jpg': [
          {
            width: 360,
            quality: 70,
            rename: {
              suffix: '-360px'
            }
          },
          {
            width: 480,
            quality: 70,
            rename: {
              suffix: '-480px'
            }
          },
          {
            width: 600,
            quality: 70,
            rename: {
              suffix: '-600px'
            }
          },
          {
            width: 720,
            quality: 70,
            rename: {
              suffix: '-720px'
            }
          },
          {
            width: 840,
            quality: 70,
            withoutEnlargement: false,
            rename: {
              suffix: '-840px'
            }
          }
        ]
      })
    )
    .pipe($.imagemin([$.imagemin.jpegtran({ progressive: true }), $.imagemin.optipng({ optimizationLevel: 5 })]))
    .pipe(gulp.dest('img'))
})

gulp.task('default', ['clean', 'images'])
