import path from 'path';
import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('scripts', () => {
  return gulp.src('assets/js/src/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.concat('main.js'))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('assets/js/dist'));
});

gulp.task('styles', () => {
  gulp.src('assets/sass/style.sass')
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
  gulp.src(['gulpfile.js'])
    .pipe($.eslint())
    .pipe($.eslint.format());
});

gulp.task('indexJade', () => {
  gulp.src('.templates/index.jade')
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
  gulp.watch(['gulpfile.js'], ['eslint']);
  gulp.watch('.content/**/*.md', ['indexJade', 'postsJade']);
  gulp.watch('**/*.jade', ['indexJade', 'postsJade']);
  gulp.watch('.templates/**/*.jade', ['indexJade', 'postsJade']);
  gulp.watch('assets/sass/**/*', ['styles']);
  gulp.watch('style.css', ['csslint']);
});

// Default Task
gulp.task('default', [
  'styles',
  'csslint',
  'eslint',
  'indexJade',
  'postsJade',
  'browser-sync',
  'watch'
]);
