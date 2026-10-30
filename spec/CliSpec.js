// Smoke tests for the imagediff command-line tool. Runs the real binary
// against the spec fixtures and checks its documented behavior.
var
  childProcess = require('child_process'),
  fs = require('fs'),
  os = require('os'),
  path = require('path');

describe('imagediff CLI', function () {

  var
    BIN = path.join(__dirname, '..', 'bin', 'imagediff'),
    CHECKMARK = path.join(__dirname, 'images', 'checkmark.png'),
    XMARK = path.join(__dirname, 'images', 'xmark.png'),
    PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // Calls back with the exit code and stdout of `imagediff ...args`.
  function run (args, callback) {
    childProcess.execFile(process.execPath, [BIN].concat(args), function (error, stdout) {
      callback(error ? error.code : 0, stdout);
    });
  }

  describe('-e', function () {

    it('prints true and exits 0 for identical images', function (done) {
      run(['-e', CHECKMARK, CHECKMARK], function (code, stdout) {
        expect(stdout).toBe('true\n');
        expect(code).toBe(0);
        done();
      });
    });

    it('prints false and exits 1 for different images', function (done) {
      run(['-e', CHECKMARK, XMARK], function (code, stdout) {
        expect(stdout).toBe('false\n');
        expect(code).toBe(1);
        done();
      });
    });
  });

  describe('-d', function () {

    var dir, output;

    beforeEach(function () {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'imagediff-cli-'));
      output = path.join(dir, 'diff.png');
    });

    afterEach(function () {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('writes a diff image to the given path', function (done) {
      run(['-d', CHECKMARK, XMARK, output], function () {
        expect(fs.existsSync(output)).withContext('diff image at ' + output).toBe(true);
        if (fs.existsSync(output)) {
          expect(fs.readFileSync(output).subarray(0, 8).equals(PNG_SIGNATURE))
            .withContext('diff image is a PNG').toBe(true);
        }
        done();
      });
    });
  });
});
