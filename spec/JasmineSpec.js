// Specs for the Jasmine add-on, js/imagediff-jasmine.js. With
// IMAGEDIFF_LIBRARY set, they load the add-on built next to that file:
// imagediff.min.js goes with imagediff-jasmine.min.js, and so on.
var imagediff = imagediff || require(
  require('path').join(__dirname, '..', process.env.IMAGEDIFF_LIBRARY || 'js/imagediff.js')
);
var imagediffJasmine = imagediffJasmine || require(
  require('path').join(
    __dirname, '..',
    (process.env.IMAGEDIFF_LIBRARY || 'js/imagediff.js')
      .replace(/imagediff((\.min)?\.js)$/, 'imagediff-jasmine$1')
  )
);

// In the browser, shows the images of a failed toImageDiffEqual in the HTML
// report. In Node.js it has nothing to draw on.
jasmine.getEnv().addReporter(imagediffJasmine.reporter);

describe('imagediff-jasmine', function () {

  it('is a reporter', function () {
    expect(typeof imagediffJasmine.reporter.jasmineStarted).toBe('function');
    expect(typeof imagediffJasmine.reporter.specDone).toBe('function');
  });

  it('leaves imagediff as it is', function () {
    expect(Object.keys(imagediff.jasmine).sort())
      .toEqual(['toBeImageData', 'toImageDiffEqual']);
    expect(imagediff.jasmineReporter).toBeUndefined();
  });
});
