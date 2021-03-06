'use strict';

// =============================================================================
// Global Vars =================================================================
// =============================================================================

// Global requirements
var gulp = require('gulp'),
    fileinclude = require('gulp-file-include'),
    notification = require('node-notifier'),
    $ = require('gulp-load-plugins')(),
    logger = require('node-human-logger'),
    markdown = require('markdown'),
    mkdirp = require('mkdirp'),
    minifyCss = require('gulp-minify-css');

// Global var
var config = require('./config');


// =============================================================================
// Notification ================================================================
// =============================================================================

// User desktop notification
var notifier = new notification();
function notifyUser(title, message) {
    notifier.notify({
        title: title,
        message: message,
        hint: 'int:transient:1'
    });
}


// =============================================================================
// Server ==================================================================
// =============================================================================

gulp.task('server', function() {
    var express = require('express');
    
    var app = express();
    app.use(require('connect-livereload')({port: config.livereload.port}));
    app.use(express.static(config.paths.html.dist));
    app.listen(config.server.port);
    
    logger.info('Server listening on port ' + config.server.port, null, 'gulp server');
});


// =============================================================================
// Livereload ==================================================================
// =============================================================================

// Live reload server
var tinylr;
gulp.task('livereload:server', function() {
    tinylr = require('tiny-lr')();
    tinylr.listen(config.livereload.port);
});

// Callback function to trigger brwoser live reload
function triggerLivereload(event) {
    var fileName = require('path').relative(__dirname, event.path);
    logger.info('Triggering live reload of ' + fileName, null, 'livereload trigger');
    tinylr.changed({
        body: {
            files: [fileName]
        }
    });
}

// Watch generated sources and trigger reload
gulp.task('livereload', ['livereload:server'], function() {
    var livereloadFolders = [
        config.paths.html.dist + '/**/*.html',
        config.paths.less.dist + '/*.css',
        config.paths.js.dist + '/*.js',
        config.paths.assets.dist + '/**/*'
    ];

    logger.info('Livereload listening "' + livereloadFolders.join('", "') + '"', null, 'gulp livereload');

    livereloadFolders.forEach(function(path) {
        gulp.watch(path, triggerLivereload);
    });
});


// =============================================================================
// Style =======================================================================
// =============================================================================

// Linter for less
gulp.task('less:lint', function(){
    return gulp.src(config.paths.less.src + '/*.less')
        .pipe(
            $.recess(config.style.linter.options)
            .on('error', function(err) {
                notifyUser('Style', 'Less linter error');
                logger.error('Recess fail: ' + err.message, null, 'gulp less:lint');
                this.emit('end');
            })
        );
});

// Compilation
gulp.task('less', ['less:lint'], function() {
    return gulp.src(config.paths.less.src + '/*.less')
        // Compilation
        .pipe(
            $.less(config.style.compilation.less.options)
            .on('error', function(err) {
                notifyUser('Style', 'Less compilation failed');
                logger.error('Less compilation error: ' + err.message, null, 'gulp less');
                this.emit('end');
            })
        )
        // Move to dist
        .pipe(gulp.dest(config.paths.less.tmp));
});

// Clean compiled stylesheet
gulp.task('less:clean', function(){
    var matching = [config.paths.less.dist + '/*.css', config.paths.less.tmp + '/*.css'];
    logger.info('Clean css: delete files matching' + matching.join(', '), null, 'gulp less:clean');
    return gulp.src(matching, { read: false })
        .pipe($.rimraf());
});


// =============================================================================
// Javascript =======================================================================
// =============================================================================

// Linter for javascript
gulp.task('js:lint', function(){
    // local to notify just one
    var hasNotifyGlobalError= false;

    return gulp.src( [ config.paths.js.src + '/*.js'] )
        .pipe( $.jshint(config.js.linter.options) )

        // Reporter to notice user
        .pipe( $.jshint.reporter(function (errors) {
            var currentFile = '';
            for(var k in errors) {
                var error = errors[k];
                // If first error in the file, put its path in console
                if(currentFile!==error.file) {
                    // Notify user about jsHint error only once
                    if(!hasNotifyGlobalError) {
                        notifyUser('Javascript', 'Javascript linter error');
                        hasNotifyGlobalError=true;
                    }
                    // Display file error in console
                    logger.error('Error in ' + error.file, null, 'gulp js:lint');
                    currentFile=error.file;
                }
                // Display error details in console
                logger.error('> Line ' + error.error.line + ' col ' +
                    error.error.character + ': ' + error.error.raw, null, 'gulp js:lint');
            }
        }));
});

// Compilation
gulp.task('js', ['js:lint'], function() {
    return gulp.src(config.paths.js.src + '/*.js')
        // Browserify
        .pipe( $.if(
            config.js.compilation.browserify.enabled,
            $.browserify(config.js.compilation.browserify.options)
            .on('error', function(err) {
                notifyUser('Javascript', 'Browserify failed');
                logger.error('js browserify error: ' + err.message, null, 'gulp js');
                this.emit('end');
            })
        ) )

        // Uglify
        .pipe( $.if(
            config.js.compilation.uglify.enabled,
            $.uglify(config.js.compilation.uglify.options)
            .on('error', function(err) {
                notifyUser('Javascript', 'Uglify failed');
                logger.error('js uglify error:' + err.message, null, 'gulp js');
                this.emit('end');
            })
        ) )

        // Move to dist folder
        .pipe(gulp.dest(config.paths.js.tmp));
});

// Clean compiled javascript
gulp.task('js:clean', function(){
    var matching = [config.paths.js.dist + '/**/*.js', config.paths.js.tmp + '/**/*.js'];
    logger.info('Clean js: delete files matching' + matching.join(', '), null, 'gulp js:clean');
    return gulp.src(matching, { read: false })
        .pipe($.rimraf());
});


// =============================================================================
// Html ========================================================================
// =============================================================================

gulp.task('html:lint', function() {
    return gulp.src(config.paths.html.src + '/*.html')
        .pipe(
            $.htmlhint(config.html.linter.options) // https://github.com/yaniswang/HTMLHint/wiki/Rules
            .on('error', function(err) {
                notifyUser('Html', 'Html lint failed!');
                logger.error('Html lint failed: ' + err.message, null, 'gulp html:lint');
                this.emit('end');
            })
        );
});

// Compilation
gulp.task('html', ['html:lint'], function() {
    return gulp.src(config.paths.html.src + '/*.html')
        // File include
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file',
            filters: {
                markdown: markdown.parse
            }
        }).on('error', function(err){
            notifyUser('Html', 'Html include failed!');
            logger.error('Html lint failed: ' + err.message, null, 'gulp html');
            this.emit('end');
        }))
        // Minify html
        .pipe( $.if(
            config.html.compilation.htmlmin.enabled,
            $.htmlmin(config.html.compilation.htmlmin.options)
            .on('error', function(err) {
                notifyUser('Html', 'Error during minification.');
                logger.error('html minification error: ' + err.message, null, 'gulp html');
                this.emit('end');
            })
        ) )
        // Usemin
        .pipe($.usemin({
            css: ['concat', minifyCss(), $.rev()],
            html: [$.htmlmin(config.html.compilation.htmlmin.options)],
            js: [$.uglify(), $.rev()]
        }))
        // Move to dist folder
        .pipe(gulp.dest(config.paths.html.dist));
});

// Compilation on first start
gulp.task('build', ['html:lint', 'less', 'js', 'fonts', 'assets'], function() {
    gulp.start('html');
});

// Clean compiled html
gulp.task('html:clean', function(){
    var matching = config.paths.html.dist + '/*.html';
    logger.info('Clean html: delete files matching' + matching, null, 'gulp html:clean');
    return gulp.src(matching, { read: false })
        .pipe($.rimraf());
});


// =============================================================================
// Assets ======================================================================
// =============================================================================

// Optimize assets
gulp.task('assets', function() {
    return gulp.src(config.paths.assets.src + '/**/*')
        .pipe($.imagemin(config.assets.images.compression))
        .pipe(gulp.dest(config.paths.assets.dist));
});

// Clean exported assets
gulp.task('assets:clean', function() {
    var matching = config.paths.assets.dist + '/**/*';
    logger.info('Clean assets: delete files matching' + matching, null, 'gulp assets:clean');
    return gulp.src(matching, { read: false })
        .pipe($.rimraf());
});


// =============================================================================
// Fonts ======================================================================
// =============================================================================

// Copy fonts
gulp.task('fonts', function() {
    return gulp.src(config.paths.fonts.src + '/**/*')
        .pipe(gulp.dest(config.paths.fonts.dist));
});


// =============================================================================
// Watcher =====================================================================
// =============================================================================

// Rebuild compiled files on source changes
gulp.task('watch', function() {
    gulp.watch(config.paths.less.src + '/**/*.less', ['less']);
    gulp.watch(config.paths.js.src + '/**/*.js', ['js']);
    gulp.watch([
        config.paths.html.src + '/**/*.html',
        config.paths.html.src + '/**/*.md',
        config.paths.less.tmp + '/**/*.css',
        config.paths.js.tmp + '/**/*.js'
    ], ['html']);
    gulp.watch(config.paths.assets.src + '/**/*', ['assets']);
});

// Gulp restart when gulpfile.js or config.js files are changed
var spawn = require('child_process').spawn;
gulp.task('watch:gulp', function() {
    var p;
    gulp.watch(['gulpfile.js', 'config.js'], function () {
        if(p) {
            p.kill();
        }
        p = spawn('gulp', ['build'], {stdio: 'inherit'});
    });
});


// =============================================================================
// Export ======================================================================
// =============================================================================

gulp.task('export', function() {
    var dest = config.paths.export || __dirname,
        task = this;

    // Prompt the path where to output the tarball
    gulp.src('gulpfile.js')
        .pipe($.prompt.prompt({
            type: 'input',
            name: 'folder',
            message: 'Where to store the tarball? [' + dest + ']'
        }, function(res){
            // Build a tarball filename based on package version and current date
            var folder = res.folder || dest,
                version = require('./package.json').version || '0',

                today = new Date(),
                dateStr =
                    today.getFullYear() +
                    (today.getMonth()+1 < 10 ? '0' + today.getMonth()+1 : today.getMonth()+1) +
                    (today.getDate() < 10 ? '0' + today.getDate() : today.getDate()) + '-' +
                    (today.getHours() < 10 ? '0' + today.getHours() : today.getHours()) +
                    (today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes()) +
                    (today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds());

            mkdirp(folder , function (err) {
                if(err) {
                    logger.error('Error while creating ' + folder, null, 'gulp export');
                    task.emit('end');
                }
            });

            var filename = folder + '/dump-v' + version + '-' + dateStr + '.tar';
            
            logger.info('Tarball destination: ' + filename, null, 'gulp export');
            require('child_process').exec('tar -cvf ' + filename + ' ' + config.paths.dist);
        }));
});

// =============================================================================
// Main tasks ==================================================================
// =============================================================================

gulp.task('clean', ['html:clean', 'less:clean', 'js:clean', 'assets:clean'], function() {});
gulp.task('default', ['build', 'server', 'livereload', 'watch', 'watch:gulp'], function() {});
