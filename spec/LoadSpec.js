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

  it('records no failures unless asked', function (done) {
    runWithoutCanvas([
      'var imagediff = require(LIBRARY);',
      'result.recording = imagediff.recordFailures(false);'
    ].join('\n'), function (result) {
      expect(result.recording).toBe(false);
      expect(result.leaked).toEqual([]);
      done();
    });
  });

  it('loads the Jasmine add-on without changing imagediff', function (done) {
    // The add-on built next to LIBRARY, as spec/JasmineSpec.js finds it.
    var addon = LIBRARY.replace(/imagediff((\.min)?\.js)$/, 'imagediff-jasmine$1');
    runWithoutCanvas([
      'var imagediff = require(require("path").join(require("path").dirname(' +
        JSON.stringify(addon) + '), "imagediff"));',
      'var before = Object.keys(imagediff).join();',
      'var addon = require(' + JSON.stringify(addon) + ');',
      'result.unchanged = Object.keys(imagediff).join() === before;',
      'result.reporter = typeof addon.reporter.jasmineStarted;',
      'result.recording = imagediff.recordFailures(false);'
    ].join('\n'), function (result) {
      expect(result.unchanged).toBe(true);
      expect(result.reporter).toBe('function');
      expect(result.recording).toBe(false);
      expect(result.leaked).toEqual([]);
      done();
    });
  });

  // Loads the add-on as a script tag would, into a context whose globals are
  // `context`, and returns the add-on's reporter.
  var loadAddonAsScript = [
    'var vm = require("vm");',
    'var ADDON = ' + JSON.stringify(LIBRARY.replace(/imagediff((\.min)?\.js)$/, 'imagediff-jasmine$1')) + ';',
    'function loadAddonAsScript (context) {',
    '  vm.runInNewContext(require("fs").readFileSync(ADDON, "utf8"), context);',
    '  return context.imagediffJasmine.reporter;',
    '}'
  ].join('\n');

  it('refuses to load the Jasmine add-on without imagediff 2.1', function (done) {
    runWithoutCanvas([
      loadAddonAsScript,
      'try {',
      '  loadAddonAsScript({ imagediff: { jasmine: {} } });',  // as 2.0.0
      '} catch (e) {',
      '  result.error = e.message;',
      '}'
    ].join('\n'), function (result) {
      expect(result.error)
        .toBe('imagediff-jasmine needs imagediff 2.1 or later: load imagediff first.');
      done();
    });
  });

  it('puts back the recording setting after a run with a report', function (done) {
    runWithoutCanvas([
      loadAddonAsScript,
      'var imagediff = require(LIBRARY);',
      'var reporter = loadAddonAsScript({',
      '  imagediff: imagediff,',
      '  document: { querySelector: function () { return {}; } },',
      '  MutationObserver: function () { this.observe = this.disconnect = function () {}; }',
      '});',
      'imagediff.recordFailures(true);',
      'reporter.jasmineStarted({});',
      'reporter.jasmineDone({});',
      'result.wasOn = imagediff.recordFailures(false);',
      'reporter.jasmineStarted({});',
      'result.duringRun = imagediff.recordFailures(true);',
      'imagediff.recordFailures(false);',
      'reporter.jasmineDone({});',
      'result.afterRun = imagediff.recordFailures(false);'
    ].join('\n'), function (result) {
      expect(result.wasOn).toBe(true);
      expect(result.duringRun).toBe(true);
      expect(result.afterRun).toBe(false);
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
