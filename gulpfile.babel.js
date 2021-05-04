import gulp from 'gulp'
import babel from 'gulp-babel'
import uglifyes from 'uglify-es'
import composer from 'gulp-uglify/composer'
import newer from 'gulp-newer'
import nodemon from 'gulp-nodemon'
import del from 'del'
import path from 'path'
import removeCode from 'gulp-remove-code'
import sourcemaps from 'gulp-sourcemaps'

const uglify = composer(uglifyes, console)

const paths = {
  js: ['src/**/*.js', '!dist/**', '!node_modules/**', '!coverage/**'],
  nonJs: ['./package.json'],
  tests: './server/tests/*.js'
}

export const clean = () => del(['dist/**', 'dist/.*', '!dist'])

export const copy = () => gulp.src(paths.nonJs, { base: '.' }).pipe(newer('dist')).pipe(gulp.dest('dist'))
export const copyData = () => gulp.src(paths.data).pipe(newer('dist/utils')).pipe(gulp.dest('dist/utils'))

export const monitor = () => nodemon({
  script: path.join('dist', 'app.js'),
  ext: 'js',
  ignore: ['node_modules/**/*.js', 'dist/**/*.js'],
  tasks: ['copy', 'scripts']
})

// NOTE: source map for debug
export function scripts () {
  return gulp.src([...paths.js, '!gulpfile.babel.js'])
    .pipe(newer('dist'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    // .pipe(sourcemaps.write('.', {sourceRoot: path.join(__dirname)}))
    .pipe(gulp.dest('dist'))
}

export function scriptsProd () {
  return gulp.src([...paths.js, '!gulpfile.babel.js'])
    .pipe(newer('dist'))
    .pipe(removeCode({ production: true }))
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest('dist'))
}

gulp.task('deploy', gulp.series(clean, copy, scripts))
gulp.task('serve', gulp.series(clean, copy, scripts, monitor))

gulp.task('product', gulp.series(clean, copy, scriptsProd))
