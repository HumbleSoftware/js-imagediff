// Specs that fail on purpose, so spec/browser/reporter.spec.js can check what
// imagediff.jasmineReporter adds to Jasmine's HTML report.
jasmine.getEnv().addReporter(imagediff.jasmineReporter);

describe('imagediff reporter fixture', function () {

  beforeEach(function () {
    jasmine.addMatchers(imagediff.jasmine);
  });

  // A width x height canvas filled with color.
  function filled (color, width, height) {
    var canvas = imagediff.createCanvas(width || 4, height || 4),
      context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  it('differs', function () {
    var actual = filled('#f00');
    expect(actual).toImageDiffEqual(filled('#00f'));
    // The report shows the image as it was when the expectation failed.
    actual.getContext('2d').fillStyle = '#0f0';
    actual.getContext('2d').fillRect(0, 0, 4, 4);
  });

  it('matches when negated', function () {
    expect(filled('#f00')).not.toImageDiffEqual(filled('#f00'));
  });

  it('differs with context', function () {
    expect(filled('#f00')).withContext('with context').toImageDiffEqual(filled('#00f'));
  });

  it('fails without images', function () {
    expect(1).toBe(2);
  });

  it('mixes failures', function () {
    // A direct call isn't an expectation, so it records nothing.
    imagediff.jasmine.toImageDiffEqual().compare(filled('#0f0'), filled('#00f'));
    expect(1).toBe(2);
    expect(filled('#f00')).toImageDiffEqual(filled('#f00'));
    expect(filled('#f00', 2, 2)).toImageDiffEqual(filled('#00f', 4, 4));
  });
});
