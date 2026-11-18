// Loads the library source (or the build in IMAGEDIFF_LIBRARY) in a fresh
// Node process, the way bundlers and installs without the optional `canvas`
// dependency see it.
var
  childProcess = require('child_process'),
  path = require('path');

describe('loading imagediff', function () {

  var LIBRARY = path.join(__dirname, '..', process.env.IMAGEDIFF_LIBRARY || 'js/imagediff.js');

  // Runs `body` in a child process with `canvas` unresolvable and calls back
  // with the JSON it prints.
  function runWithoutCanvas (body, callback) {
    var script = [
      'var Module = require("module");',
      'var resolve = Module._resolveFilename;',
      'Module._resolveFilename = function (request) {',
      '  if (request === "canvas") throw new Error("Cannot find module \'canvas\'");',
      '  return resolve.apply(this, arguments);',
      '};',
      'var LIBRARY = ' + JSON.stringify(LIBRARY) + ';',
      'var globals = Object.keys(global);',
      'var result = {};',
      body,
      'result.leaked = Object.keys(global).filter(function (key) {',
      '  return globals.indexOf(key) === -1;',
      '});',
      'console.log(JSON.stringify(result));'
    ].join('\n');
    childProcess.execFile(process.execPath, ['-e', script], function (error, stdout, stderr) {
      expect(error).withContext(stderr).toBe(null);
      callback(error ? {} : JSON.parse(stdout));
    });
  }

  it('loads without canvas and reports the missing module on use', function (done) {
    runWithoutCanvas([
      'var imagediff = require(LIBRARY);',
      'try {',
      '  imagediff.createCanvas(1, 1);',
      '} catch (e) {',
      '  result.error = { name: e.name, message: e.message };',
      '}'
    ].join('\n'), function (result) {
      expect(result.error && result.error.name).toBe('Error');
      expect(result.error && result.error.message)
        .toContain('https://github.com/HumbleSoftware/js-imagediff#cannot-find-module-canvas');
      expect(result.leaked).toEqual([]);
      done();
    });
  });

  it('has no Jasmine reporter without the add-on', function (done) {
    runWithoutCanvas([
      'var imagediff = require(LIBRARY);',
      'result.reporter = typeof imagediff.jasmineReporter;',
      'result.negativeCompare = typeof imagediff.jasmine.toImageDiffEqual().negativeCompare;'
    ].join('\n'), function (result) {
      expect(result.reporter).toBe('undefined');
      expect(result.negativeCompare).toBe('undefined');
      expect(result.leaked).toEqual([]);
      done();
    });
  });

  it('loads the Jasmine add-on onto imagediff', function (done) {
    // The add-on built next to LIBRARY, as spec/JasmineSpec.js finds it.
    var addon = LIBRARY.replace(/imagediff((\.min)?\.js)$/, 'imagediff-jasmine$1');
    runWithoutCanvas([
      'var addon = require(' + JSON.stringify(addon) + ');',
      'var imagediff = require(require("path").join(require("path").dirname(' +
        JSON.stringify(addon) + '), "imagediff"));',
      'result.same = addon === imagediff;',
      'result.reporter = typeof imagediff.jasmineReporter;',
      'result.negativeCompare = typeof imagediff.jasmine.toImageDiffEqual().negativeCompare;'
    ].join('\n'), function (result) {
      expect(result.same).toBe(true);
      expect(result.reporter).toBe('object');
      expect(result.negativeCompare).toBe('function');
      expect(result.leaked).toEqual([]);
      done();
    });
  });

  it('loads in strict mode with an undefined `this`', function (done) {
    // Mimics a bundler wrapping the CommonJS module in strict mode.
    runWithoutCanvas([
      'var source = require("fs").readFileSync(LIBRARY, "utf8");',
      'var module = { exports: {} };',
      'new Function("module", "exports", "require", "\'use strict\';\\n" + source)',
      '  .call(undefined, module, module.exports, require);',
      'result.exports = Object.keys(module.exports).sort();'
    ].join('\n'), function (result) {
      expect(result.exports).toContain('diff');
      expect(result.exports).toContain('noConflict');
      expect(result.leaked).toEqual([]);
      done();
    });
  });
});
