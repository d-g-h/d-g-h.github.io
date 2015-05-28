## [Gulp Generated Static Site](post/Gulp-Static-Site-Generator.html)

![Gulp running in terminal](https://www.dropbox.com/s/l1z33fqfyetcd0p/gulpBrowserSync.gif?raw=1)

### Why?
```sh
gulp
```
A site should be simple. I should be able to use a daily used language to highlight some thoughts about sharing information digitally. A site of this natural should also be not based on my sole opinion, but rather, it should be corrected, or duplicated, or replicated for the general public. Source control, and centralized repository, namely GitHub at this time should help with that. Markdown should help with writing, separating presentation and the content. It should be able to travel with us, until the end of time.

To run the file below, you will need to either node or iojs(2.10), which is what I have started to
run. The idea here to run checks on files on file changes, and to see changes immediately.

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
var markdown     = require('gulp-markdown');
var jade         = require('gulp-jade');
var browserSync  = require('browser-sync');
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

gulp.task('markdown', function() {
  var stream = gulp.src(['content/**/*.md'])
    .pipe(markdown({
      gfm: true,
      tables: true,
      breaks: true,
      sanitize: false,
      highlight: function(code) {
        return require('highlight.js').highlightAuto(code).value;
      }
    }))
    .pipe(gulp.dest('blog'));
  return stream;
});

//markdown, then jade
gulp.task('indexJade', ['markdown'], function() {
  gulp.src('templates/index.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('.'))
    .pipe(reload({stream: true}));

});

//markdown, then jade
gulp.task('resumeJade', ['markdown'], function() {
  gulp.src('templates/resume.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('.'))
    .pipe(reload({stream: true}));

});

gulp.task('browser-sync', function() {
  browserSync({
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
  gulp.watch('assets/sass/**/*', ['sass']);
  gulp.watch('style.css', ['csslint']);
  gulp.watch('templates/**/*.jade', ['indexJade', 'resumeJade']);
  gulp.watch(['gulpfile.js'], ['jscs', 'jshint']);
  gulp.watch('**/*.md', ['indexJade', 'resumeJade', 'markdown']);
});

// Default Task
gulp.task('default', [
  'sass',
  'csslint',
  'jshint',
  'jscs',
  'markdown',
  'indexJade',
  'resumeJade',
  'browser-sync',
  'watch'
]);
```

Modified <time datetime=2015-05-17>May 17, 2015</time>
