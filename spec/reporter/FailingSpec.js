// Specs that fail on purpose, for spec/browser/reporter.spec.js. Each failure
// uses its own colors, so the report shows whose images are whose.
describe('reporter fixture', function () {

  var
    RED     = 'rgb(255, 0, 0)',
    GREEN   = 'rgb(0, 255, 0)',
    BLUE    = 'rgb(0, 0, 255)',
    YELLOW  = 'rgb(255, 255, 0)',
    WHITE   = 'rgb(255, 255, 255)';

  function fill (canvas, color) {
    var context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function solid (color, width, height) {
    return fill(imagediff.createCanvas(width || 30, height || 20), color);
  }

  // In beforeAll, so that the suites' own beforeAll and afterAll have the
  // matchers too.
  beforeAll(function () {
    jasmine.addMatchers(imagediff.jasmine);
  });

  it('fails toImageDiffEqual', function () {
    expect(solid(RED)).toImageDiffEqual(solid(BLUE));
  });

  it('fails not.toImageDiffEqual', function () {
    expect(solid(GREEN)).not.toImageDiffEqual(solid(GREEN));
  });

  it('fails with context', function () {
    expect(solid(YELLOW)).withContext('the chart').toImageDiffEqual(solid(BLUE));
  });

  it('fails without an image matcher', function () {
    expect(1).toBe(2);
  });

  it('fails several ways', function () {
    expect(true).toBe(false);
    expect(solid(RED)).toImageDiffEqual(solid(RED));
    // A direct call isn't an expectation, and keeps no images.
    imagediff.jasmine.toImageDiffEqual().compare(solid(RED), solid(WHITE));
    expect(solid(RED, 40, 20)).toImageDiffEqual(solid(BLUE, 20, 40));
    expect(imagediff.toImageData(solid(GREEN))).toImageDiffEqual(solid(RED).getContext('2d'));
  });

  it('fails before the canvas changes', function () {
    var canvas = solid(WHITE);
    expect(canvas).toImageDiffEqual(solid(BLUE));
    fill(canvas, RED);
  });

  it('fails with images that do not line up', function () {
    // Images kept for a failure that Jasmine never reports.
    imagediff.jasmine.toImageDiffEqual({}).compare(solid(WHITE), solid(RED));
    expect(solid(GREEN)).toImageDiffEqual(solid(BLUE));
  });

  it('passes', function () {
    expect(solid(RED)).toImageDiffEqual(solid(RED));
    expect(solid(RED)).not.toImageDiffEqual(solid(BLUE));
  });

  describe('with a failing beforeAll', function () {

    beforeAll(function () {
      expect(solid(GREEN)).toImageDiffEqual(solid(RED));
    });

    it('has a spec', function () {
      expect(solid(BLUE)).toImageDiffEqual(solid(YELLOW));
    });
  });

  describe('with a failing afterAll', function () {

    it('fails in a spec', function () {
      expect(solid(BLUE)).toImageDiffEqual(solid(RED));
    });

    describe('and a failing suite inside', function () {

      afterAll(function () {
        expect(solid(WHITE)).toImageDiffEqual(solid(GREEN));
      });

      it('passes', function () {
        expect(true).toBe(true);
      });
    });

    afterAll(function () {
      expect(solid(YELLOW)).toImageDiffEqual(solid(RED));
      expect(solid(WHITE)).toImageDiffEqual(solid(BLUE));
    });
  });
});

// Jasmine reports this one apart from the specs and suites, without images.
afterAll(function () {
  jasmine.addMatchers(imagediff.jasmine);
  expect(imagediff.createCanvas(2, 2)).toImageDiffEqual(imagediff.createCanvas(3, 3));
});
