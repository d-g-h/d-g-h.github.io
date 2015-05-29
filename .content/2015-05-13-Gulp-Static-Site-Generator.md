## [Gulp Generated Static Site](/posts/Gulp-Static-Site-Generator)

![Gulp running in terminal](https://www.dropbox.com/s/l1z33fqfyetcd0p/gulpBrowserSync.gif?raw=1)

### Why?
```sh
gulp
```
A site should be simple. I should be able to use a daily used language to highlight some thoughts about sharing information digitally. A site of this natural should also be not based on my sole opinion, but rather, it should be corrected, or duplicated, or replicated by anyone. Source control, and centralized repository, namely GitHub at this time should help with that. Markdown should help with writing, separating presentation and the content.

To run the file below, you will need to either node or iojs(2.10), which is what I have started to
run. The idea here to run checks on files on file changes, and to see changes immediately, and to
regenerate all the content. For my purposes this is perfect for the 4-6 posts I plan on writing for
the year.

### How?

```js
var gulp         = require('gulp');
var sass         = require('gulp-sass');
var sourcemaps   = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var csslint      = require('gulp-csslint');
var jshint       = require('gulp-jshint');
var jscs         = require('gulp-jscs');
var stylish      = require('jshint-stylish');
var jade         = require('gulp-jade');
var path         = require('path');
var tap          = require('gulp-tap');
var browserSync  = require('browser-sync').create();
var reload       = browserSync.reload;

gulp.task('sass', function() {
  gulp.src('assets/sass/style.sass')
    .pipe(sourcemaps.init())
    .pipe(sass({
      indentedSyntax: true,
      outputStyle: 'compressed',
      errLogToConsole: true
    }))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('.'))
    .pipe(reload({stream: true}));
});

gulp.task('csslint', function() {
  gulp.src('style.css')
    .pipe(csslint('.csslintrc'))
    .pipe(csslint.reporter());
});

gulp.task('jshint', function() {
  gulp.src(['gulpfile.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter(stylish));
});

gulp.task('jscs', function() {
  return gulp.src(['gulpfile.js'])
    .pipe(jscs());
});

gulp.task('indexJade', function() {
  gulp.src('.templates/index.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('.'))
    .pipe(reload({stream: true}));

});

/*
 *Here let's create, and maintain the content in .content
 *Once, we are ready to go, we can feature it in the .template/index.jade,
 *and/or we can add a new directory (named after the title), and copy of 
 *over the layout with specific .content that matches. The task below will
 *generate the .html in the same directory four times a year.
 */

gulp.task('postsJade', function() {
  gulp.src('posts/**/*.jade')
    .pipe(tap(function(file, t) {
      var filename = path.basename(file.path);
      var dirname  = path.basename(path.dirname(file.path));
      return gulp.src(file.path)
      .pipe(jade({
        pretty: true,
        name: filename
      }))
      .pipe(gulp.dest('posts/' + dirname));
    }))
    .pipe(reload({stream: true}));

});

gulp.task('resumeJade', function() {
  gulp.src('resume/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('resume'))
    .pipe(reload({stream: true}));
});

gulp.task('browser-sync', function() {
  browserSync.init({
    server: true,
    notify: false,
    ghostMode: {
      clicks: true,
      forms: true,
      scroll: true
    },
    logConnections: true,
    open: true,
    port: 8001
  });
});

gulp.task('watch', function() {
  gulp.watch(['gulpfile.js'], ['jscs', 'jshint']);
  gulp.watch('.content/**/*.md', ['indexJade', 'postsJade']);
  gulp.watch('**/*.jade', ['indexJade', 'postsJade']);
  gulp.watch('.templates/**/*.jade', ['indexJade', 'postsJade']);
  gulp.watch('assets/sass/**/*', ['sass']);
  gulp.watch('style.css', ['csslint']);
});

// Default Task
gulp.task('default', [
  'sass',
  'csslint',
  'jshint',
  'jscs',
  'indexJade',
  'postsJade',
  'browser-sync',
  'watch'
]);
```

Modified <time datetime=2015-05-17>May 17, 2015</time>
