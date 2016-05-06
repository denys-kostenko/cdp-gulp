var gulp = require('gulp');
var bower = require('gulp-bower');
var less = require('gulp-less');
var del = require('del');
var util = require('gulp-util');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
var htmlreplace = require('gulp-html-replace');
var uglify = require('gulp-uglify');
// var mainBowerFiles = require('main-bower-files');
//var filter = require('gulp-filter');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var eslint = require('gulp-eslint');
var plato = require('gulp-plato');
var gulpStylelint = require('gulp-stylelint');

var argv = require('minimist')(process.argv.slice(2), {
  string: 'env',
  'default': { env: process.env.NODE_ENV || 'development' }
});

var conf = {
  less: 'src/less/*.less',
  images: ['src/images/**/*.{png,svg}', '!src/images/icons/**'],
  icons: 'src/images/icons/*.png',
  html: 'src/*.html',
  js: 'src/*.js ',
  reports: {
    folder: 'reports',
    plato: 'reports/plato',
    stylelint: 'reports/stylelint'
  },
  sprite: {
    imgName: 'images/build/sprite.png',
    cssName: 'less/build/sprite.less',
    imgPath: '../images/build/sprite.png'
  },
  build: {
    tmpFolders: '**/build',
    folder: 'build',
    css: 'build/css',
    images: 'build/images',
    js: 'build/js',
    html: 'build/html'
  }
};

var bootstrap = {
  less: 'bower_components/bootstrap/less/bootstrap.less'
};

gulp.task('bower', function () {
  return bower()
      .pipe(gulp.dest('bower_components'));
});

gulp.task('style', ['clean', 'bower', 'images'], function () {
  return gulp.src([bootstrap.less, conf.less])
      .pipe(less())
      .pipe(autoprefixer(['last 2 version']))
      .pipe(concat('cdp.css'))
      // Compress code only on production build
      .pipe(gulpif(argv.env === 'production', csso()))
      .pipe(gulp.dest(conf.build.css));
});

gulp.task('style-watch', function () {
  return gulp.src([bootstrap.less, conf.less])
      .pipe(cached())
      .pipe(less())
      .on('error', errorHandler)
      .pipe(autoprefixer(['last 2 version']))
      .pipe(remember())
      .pipe(concat('cdp.css'))
      .pipe(gulp.dest(conf.build.css));
});

gulp.task('images', ['clean', 'bower', 'sprite'], function () {
  return gulp.src(conf.images)
      .pipe(gulpif(argv.env === 'production', imagemin()))
      .pipe(gulp.dest(conf.build.images));
});

gulp.task('sprite', ['clean'], function () {
  return gulp.src(conf.icons)
      .pipe(spritesmith(conf.sprite))
      .pipe(gulp.dest('src/'));
});

gulp.task('html', ['clean'], function () {
  return gulp.src(conf.html)
      .pipe(htmlreplace({
        css: '../css/cdp.css',
        js: '../js/cdp.js',
        logo: {
          src: '../images/logo_gray-blue_80px.svg',
          tpl: '<img src="%s" alt="Epam logo"/>'
        }
      }))
      .pipe(gulp.dest(conf.build.html));
});

gulp.task('script', ['clean', 'bower'], function () {
  return browserify('./src/js/main.js', { debug:true })
      .transform('debowerify')
      .bundle()
      .pipe(source('cdp.js'))
      .pipe(gulpif(argv.env === 'production', uglify()))
      .pipe(gulp.dest(conf.build.js));
});

gulp.task('lint', function () {
  return gulp.src(['**/*.js', '!node_modules/**', '!bower_components/**', '!build/**', '!reports/**'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('plato', function () {
  return gulp.src('src/**/*.js')
      .pipe(plato(conf.reports.plato, {
        complexity: {
          trycatch: true
        }
      }));
});

gulp.task('lint-css', function lintCssTask() {
  return gulp.src([conf.less])
      .pipe(gulpStylelint({
        reporters: [
          { formatter: 'string', console: true },
          { formatter: 'verbose', save: conf.reports.stylelint + '/report.txt' }
        ],
        syntax: 'less'
      }));
});

gulp.task('clean', function () {
  return del([conf.build.folder, conf.build.tmpFolders, conf.reports.folder]);
});

gulp.task('build', ['lint-css', 'style', 'images', 'html', 'lint', 'script', 'plato']);

gulp.task('watch', ['build'], function () {
  return gulp.watch(conf.less, ['style-watch']);
});

function errorHandler(error) {
  util.log(util.colors.red('Error'), error.message);

  this.end();
}
