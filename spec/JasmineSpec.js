// Specs for the Jasmine add-on, js/imagediff-jasmine.js. With
// IMAGEDIFF_LIBRARY set, they load the add-on built next to that file:
// imagediff.min.js goes with imagediff-jasmine.min.js, and so on.
var imagediff = imagediff || require(
  require('path').join(
    __dirname, '..',
    (process.env.IMAGEDIFF_LIBRARY || 'js/imagediff.js')
      .replace(/imagediff((\.min)?\.js)$/, 'imagediff-jasmine$1')
  )
);

// In the browser, shows the images of a failed toImageDiffEqual in the HTML
// report. In Node.js it has nothing to draw on.
jasmine.getEnv().addReporter(imagediff.jasmineReporter);

describe('imagediff-jasmine', function () {

  var a, b, c;

  beforeEach(function () {
    a = imagediff.createImageData(1, 1);
    b = imagediff.createImageData(1, 1);
    c = imagediff.createImageData(1, 1);
    c.data[0] = 255;
    c.data[3] = 255;
  });

  describe('toImageDiffEqual', function () {

    var toImageDiffEqual;

    beforeEach(function () {
      toImageDiffEqual = imagediff.jasmine.toImageDiffEqual();
    });

    it('passes when imagediff equal', function () {
      expect(toImageDiffEqual.compare(a, b))
        .toEqual({ pass: true, message: 'Expected not to be equal.' });
    });

    it('fails when not imagediff equal', function () {
      expect(toImageDiffEqual.compare(a, c))
        .toEqual({ pass: false, message: 'Expected to be equal.' });
    });

    it('fails when negated and imagediff equal', function () {
      expect(toImageDiffEqual.negativeCompare(a, b))
        .toEqual({ pass: false, message: 'Expected not to be equal.' });
    });

    it('passes when negated and not imagediff equal', function () {
      expect(toImageDiffEqual.negativeCompare(a, c))
        .toEqual({ pass: true, message: 'Expected to be equal.' });
    });

    it('gives the same result when called by Jasmine', function () {
      // Jasmine passes its matcher utilities, and the reporter is added.
      expect(imagediff.jasmine.toImageDiffEqual({}).compare(a, c))
        .toEqual({ pass: false, message: 'Expected to be equal.' });
    });

    it('throws when not image', function () {
      expect(function () {
        toImageDiffEqual.compare(a, {});
      }).toThrow();
    });

    it('works through expect', function () {
      jasmine.addMatchers(imagediff.jasmine);
      expect(a).toImageDiffEqual(b);
      expect(a).not.toImageDiffEqual(c);
    });
  });

  describe('jasmineReporter', function () {

    it('is a reporter', function () {
      expect(typeof imagediff.jasmineReporter.jasmineStarted).toBe('function');
      expect(typeof imagediff.jasmineReporter.specDone).toBe('function');
    });

    it('is not added as a matcher', function () {
      expect(Object.keys(imagediff.jasmine).sort())
        .toEqual(['toBeImageData', 'toImageDiffEqual']);
    });
  });
});
