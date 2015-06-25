#### A commandline driven blog created with the aid of Gulp, Jade, Markdown, and SASS

```js
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
