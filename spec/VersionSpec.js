// Checks that a built file (IMAGEDIFF_LIBRARY) names the package version in
// its header. The source has no header, so this only runs against a build.
var
  fs = require('fs'),
  path = require('path'),
  version = require('../package.json').version,
  library = process.env.IMAGEDIFF_LIBRARY;

if (library) {
  describe('the built file header', function () {
    it('names the package version', function () {
      var source = fs.readFileSync(path.join(__dirname, '..', library), 'utf8');
      expect(source.split('\n')[0]).toBe('// js-imagediff ' + version);
    });

    it('names the package version in the Jasmine add-on built next to it', function () {
      var addon = library.replace(/imagediff((\.min)?\.js)$/, 'imagediff-jasmine$1');
      var source = fs.readFileSync(path.join(__dirname, '..', addon), 'utf8');
      expect(source.split('\n')[0]).toBe('// js-imagediff-jasmine ' + version);
    });
  });
}
