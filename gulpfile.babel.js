import path from 'path';
import childProcess from 'child_process';
import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const exec = childProcess.exec;
const port = '8001';

gulp.task('scripts', () => {
  return gulp.src('assets/js/src/**/*.js')
    .pipe($.changed('asset/js/dist', {extension: '.js'}))
    .pipe($.babel({stage: 1}))
    .pipe($.concat('main.min.js'))
    .pipe($.uglify({preserveComments: 'some'}))
    .pipe(gulp.dest('assets/js/dist'));
});

gulp.task('styles', () => {
  gulp.src('assets/sass/style.sass')
    .pipe($.changed('.', {extension: '.sass'}))
    .pipe($.sass({
      indentedSyntax: true,
      outputStyle: 'compressed',
      errLogToConsole: true,
      sourceComments: false
    }))
    .pipe($.autoprefixer())
    .pipe(gulp.dest('.'))
    .pipe(reload({stream: true}));
});

gulp.task('csslint', () => {
  gulp.src('style.css')
    .pipe($.csslint('.csslintrc'))
    .pipe($.csslint.reporter());
});

gulp.task('eslint', () => {
  gulp.src(['assets/js/src/*.js', 'gulpfile.babel.js'])
    .pipe($.eslint())
    .pipe($.eslint.format());
});

gulp.task('exec', () => {
  exec('pa11y -s Section508 localhost:8001 --color', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
  });
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
    open: false,
    port: port
  });
});

gulp.task('watch', () => {
  gulp.watch(['assets/**/*.js', 'gulpfile.babel.js'], { interval: 500 }, ['eslint', 'styles']);
  gulp.watch(
    [
      '.content/**/*.md',
      '**/*.jade',
      '.templates/**/*.jade'
    ],
    { interval: 500 },
    [
      'indexJade',
      'postsJade',
      'exec'
    ]
  );
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
  'exec',
  'watch'
]);
