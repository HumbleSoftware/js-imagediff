// Builds imagediff.js and imagediff-jasmine.js (license header + source),
// and a minified copy of each.
// No bundling or transpiling: the source ships as written.

var fs = require('fs');
var path = require('path');
var terser = require('terser');

var root = path.join(__dirname, '..');

function read (file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function write (file, contents) {
  fs.writeFileSync(path.join(root, file), contents);
  console.log('Wrote ' + file);
}

// The header names the package version, so it can't drift from it.
var version = require('../package.json').version;

function build (name) {
  var license = '// js-' + name + ' ' + version + '\n' + read('js/license.js');
  var source = license + '\n' + read('js/' + name + '.js');

  write(name + '.js', source);

  return terser.minify(source, {
    // The library targets ES5 (IE9). Keep the minifier from emitting
    // anything newer than that.
    ecma: 5,
    compress: { ecma: 5 },
    format: { ecma: 5, comments: false, preamble: license.trim() }
  }).then(function (result) {
    write(name + '.min.js', result.code + '\n');
  });
}

build('imagediff').then(function () {
  return build('imagediff-jasmine');
}).catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
