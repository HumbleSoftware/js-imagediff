// Specs that fail on purpose. spec/browser/reporter.spec.js runs them in
// spec/reporter/ and checks the images imagediff.jasmineReporter adds to
// Jasmine's HTML report.
describe('reporter fixture', function () {

  var
    RED   = '#ff0000',
    GREEN = '#00ff00',
    BLUE  = '#0000ff';

  function solid (color, width, height) {
    var
      canvas = imagediff.createCanvas(width || 40, height || 30),
      context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  beforeEach(function () {
    jasmine.addMatchers(imagediff.jasmine);
  });

  it('passes', function () {
    expect(solid(RED)).toImageDiffEqual(solid(RED));
    expect(solid(RED)).not.toImageDiffEqual(solid(BLUE));
  });

  it('fails toImageDiffEqual', function () {
    var actual = solid(RED);
    expect(actual).toImageDiffEqual(solid(BLUE));
    // The report shows the image as it was when compared.
    actual.getContext('2d').clearRect(0, 0, actual.width, actual.height);
  });

  it('fails not.toImageDiffEqual', function () {
    expect(solid(GREEN)).not.toImageDiffEqual(solid(GREEN));
  });

  it('fails several expectations', function () {
    expect(1).toBe(2);
    expect(solid(RED)).withContext('in context').toImageDiffEqual(solid(GREEN));
    expect(solid(RED)).toImageDiffEqual(solid(RED));
    expect(solid(BLUE, 20, 20)).toImageDiffEqual(solid(GREEN, 60, 40));
  });

  it('fails without images', function () {
    expect('a').toBe('b');
    expect({}).toBeImageData();
  });

  it('fails after calling the matcher directly', function () {
    // This comparison fails without failing an expectation, so the reporter
    // can't tell which images belong to the failure below. It shows none.
    imagediff.jasmine.toImageDiffEqual().compare(solid(RED), solid(BLUE));
    expect(solid(RED)).toImageDiffEqual(solid(GREEN));
  });

  describe('with failing hooks', function () {

    beforeAll(function () {
      jasmine.addMatchers(imagediff.jasmine);
      expect(solid(GREEN)).toImageDiffEqual(solid(BLUE));
    });

    afterAll(function () {
      expect(solid(BLUE)).toImageDiffEqual(solid(RED));
    });

    it('fails between them', function () {
      expect(solid(GREEN)).toImageDiffEqual(solid(RED));
    });
  });
});
