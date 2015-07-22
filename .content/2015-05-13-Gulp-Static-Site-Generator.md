## [Gulp Generated Static Site](/posts/Gulp-Static-Site-Generator)

![Gulp running in terminal](https://www.dropbox.com/s/l1z33fqfyetcd0p/gulpBrowserSync.gif?raw=1)

### Why?
```sh
gulp
```
This site is simple. It’s based on [an easy-to-read and easy-to-write as is feasible](http://daringfireball.net/projects/markdown/syntax#philosophy) language (markdown) to share information. It can be corrected, or duplicated, or replicated by anyone over at https://github.com/d-g-h/d-g-h.github.com

### How?

The dependencies are [iojs](https://iojs.org/)(2.31), or [node](http://blog.nodejs.org/2015/07/10/node-v0-12-7-stable/)(v0.12.7), and everything in `package.json`.

Run `npm install`.

The idea here is to watch for file changes, and then recompile all related styles, scripts, and content.

```js
//ECMAScript 2015, ECMAScript 6, ES6 version
import path from 'path';
import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('scripts', () => {
  return gulp.src('assets/js/src/**/*.js')
    .pipe($.changed('asset/js/dist', {extension: '.js'}))
    .pipe($.sourcemaps.init())
    .pipe($.babel({stage: 1}))
    .pipe($.concat('main.min.js'))
    .pipe($.uglify({preserveComments: 'some'}))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('assets/js/dist'));
});

gulp.task('styles', () => {
  gulp.src('assets/sass/style.sass')
    .pipe($.changed('.', {extension: '.sass'}))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      indentedSyntax: true,
      outputStyle: 'compressed',
      errLogToConsole: true
    }))
    .pipe($.autoprefixer())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.'))
    .pipe(reload({stream: true}));
});

gulp.task('csslint', () => {
  gulp.src('style.css')
    .pipe($.csslint('.csslintrc'))
    .pipe($.csslint.reporter());
});

gulp.task('eslint', () => {
  gulp.src(['assets/js/src/*.js', 'gulpfile.js'])
    .pipe($.eslint())
    .pipe($.eslint.format());
});

gulp.task('indexJade', () => {
  gulp.src('.templates/index.jade')
    .pipe($.changed('.', {extension: '.jade'}))
    .pipe($.jade({
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

gulp.task('postsJade', () => {
  gulp.src('posts/**/*.jade')
    .pipe($.tap( file => {
      let filename = path.basename(file.path);
      let dirname  = path.basename(path.dirname(file.path));
      return gulp.src(file.path)
      .pipe($.jade({
        pretty: true,
        name: filename
      }))
      .pipe(gulp.dest('posts/' + dirname));
    }))
    .pipe(reload({stream: true}));
});

gulp.task('resumeJade', () => {
  gulp.src('resume/*.jade')
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('resume'))
    .pipe(reload({stream: true}));
});

gulp.task('browser-sync', () => {
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

gulp.task('watch', () => {
  gulp.watch(['**/*.js'], { interval: 500 }, ['eslint', 'styles']);
  gulp.watch('.content/**/*.md', { interval: 500 }, ['indexJade', 'postsJade']);
  gulp.watch('**/*.jade', { interval: 500 }, ['indexJade', 'postsJade']);
  gulp.watch('.templates/**/*.jade', { interval: 500 }, ['indexJade', 'postsJade']);
  gulp.watch('assets/sass/**/*', { interval: 500 }, ['styles']);
  gulp.watch('style.css', { interval: 500 }, ['csslint']);
});

// Default Task
gulp.task('default', [
  'styles',
  'scripts',
  'csslint',
  'eslint',
  'indexJade',
  'postsJade',
  'browser-sync',
  'watch'
]);
```

```js
//ES5 version
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

Modified <time datetime=2015-07-22>July 22, 2015</time>
