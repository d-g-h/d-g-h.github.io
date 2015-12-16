import path from 'path';
import childProcess from 'child_process';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import critical from './lib/gulp/dist/critical';

const $ = gulpLoadPlugins({
  pattern: ['gulp-*', 'gulp.*', 'browser-sync'],
  rename: {
    'browser-sync': 'browserSync'
  }
});
const reload = $.browserSync.reload;
const exec = childProcess.exec;
const port = '8001';

gulp.task('build', () => {
  return gulp.src('assets/js/src/**/*.js')
    .pipe($.changed('asset/js/dist', {extension: '.js'}))
    .pipe($.babel())
    .pipe($.concat('main.min.js'))
    .pipe($.uglify({preserveComments: 'some'}))
    .pipe(gulp.dest('assets/js/dist'));
});

gulp.task('transform', () => {
  return gulp.src('test/src/**/*.js')
    .pipe($.changed('test/dist/**/*.js', {extension: '.js'}))
    .pipe($.babel())
    .pipe(gulp.dest('test/dist'));
});

gulp.task('compiles', () => {
  return gulp.src('lib/gulp/src/*.js')
    .pipe($.babel())
    .pipe(gulp.dest('lib/gulp/dist'));
});

gulp.task('styles', () => {
  gulp.src('assets/sass/style.sass')
    .pipe($.changed(process.cwd(), {extension: '.sass'}))
    .pipe($.sass({
      indentedSyntax: true,
      outputStyle: 'compressed',
      errLogToConsole: true,
      sourceComments: false
    }))
    .pipe($.autoprefixer())
    .pipe(gulp.dest(process.cwd()))
    .pipe(reload({stream: true}));
});

gulp.task('sassLint', () => {
  gulp.src('assets/sass/**/*.s+(a|c)ss')
    .pipe($.sassLint())
    .pipe($.sassLint.format());
});

gulp.task('csslint', () => {
  gulp.src('style.css')
    .pipe($.csslint('.csslintrc'))
    .pipe($.csslint.reporter());
});

gulp.task('eslint', () => {
  gulp.src(['assets/js/src/*.js', 'lib/gulp/src/**/*', 'test/src/**/*', 'gulpfile.babel.js'])
    .pipe($.eslint())
    .pipe($.eslint.format());
});

gulp.task('pa11y', () => {
  exec(`pa11y -s Section508 localhost:${port} --color`, (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
  });
  exec(`pa11y -s Section508 localhost:${port}/resume --color`, (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
  });
});

gulp.task('critical', () => {
  critical({
    src: process.cwd() + '/index.html',
    base: process.cwd(),
    dest: process.cwd() + '/index.html',
    inline: true,
    width: 1440,
    height: 900
  }, (err) => {
    if (err) console.log(err);
  });
});

gulp.task('indexJade', () => {
  gulp.src('.templates/index.jade')
    .pipe($.changed(process.cwd(), {extension: '.jade'}))
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest(process.cwd()))
    .pipe(reload({stream: true}));
});

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
  $.browserSync.init({
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
  gulp.watch(['assets/**/*.js', 'gulpfile.babel.js'], { interval: 500 }, ['eslint', 'styles', 'pa11y']);
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
      'resumeJade',
      'critical',
      'pa11y'
    ]
  );
  gulp.watch('assets/sass/**/*', { interval: 500 }, ['sassLint', 'styles']);
  gulp.watch('test/**/*', ['transform', 'eslint']);
  gulp.watch('lib/**/*', ['compiles', 'eslint']);
  gulp.watch('style.css', { interval: 500 }, ['csslint', 'pa11y']);
});

gulp.task('default', [
  'browser-sync',
  'sassLint',
  'styles',
  'build',
  'csslint',
  'eslint',
  'indexJade',
  'postsJade',
  'watch'
]);
