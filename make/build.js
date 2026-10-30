// Builds imagediff.js (license header + source) and imagediff.min.js.
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

var license = read('js/license.js');
var source = license + '\n' + read('js/imagediff.js');

write('imagediff.js', source);

terser.minify(source, {
  // The library targets ES5 (IE9). Keep the minifier from emitting
  // anything newer than that.
  ecma: 5,
  compress: { ecma: 5 },
  format: { ecma: 5, comments: false, preamble: license.trim() }
}).then(function (result) {
  write('imagediff.min.js', result.code + '\n');
}).catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
