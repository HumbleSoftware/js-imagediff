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

  // Node only: loads a fresh copy of the add-on, as a script tag would, so
  // this run's own reporter keeps its state.
  (typeof module !== 'undefined' ? it : xit)('leaves the record alone in a run without a report', function () {
    var
      context = { imagediff: imagediff },
      source = require('fs').readFileSync(require('path').join(
        __dirname, '..',
        (process.env.IMAGEDIFF_LIBRARY || 'js/imagediff.js')
          .replace(/imagediff((\.min)?\.js)$/, 'imagediff-jasmine$1')
      ), 'utf8'),
      reporter, wasRecording, taken;

    require('vm').runInNewContext(source, context);
    reporter = context.imagediffJasmine.reporter;

    wasRecording = imagediff.recordFailures(true);
    imagediff.takeFailures();
    try {
      reporter.jasmineStarted({});
      reporter.suiteStarted({ id: 'suite1' });
      reporter.specStarted({ id: 'spec1' });
      imagediff.jasmine.toImageDiffEqual({}).compare(
        imagediff.createImageData(1, 1), imagediff.createImageData(2, 2));
      reporter.specDone({ id: 'spec1', status: 'failed', failedExpectations: [] });
      reporter.jasmineDone({});
      taken = imagediff.takeFailures();
      expect(taken.length).toBe(1);
      expect(imagediff.recordFailures(true)).toBe(true);
    } finally {
      imagediff.recordFailures(wasRecording);
    }
  });
});
