var
  //TODO can roll isNode up into a function if checks get longer
  isNode    = typeof module !== 'undefined',
  Canvas    = isNode && require('canvas'),
  imagediff = imagediff || require('../js/imagediff.js');

describe('ImageUtils', function() {

  var
    OBJECT            = 'object',
    TYPE_CANVAS       = isNode ? '[object Canvas]' : '[object HTMLCanvasElement]',
    E_TYPE            = { name : 'ImageTypeError', message : 'Submitted object was not an image.' };

  function getContext () {
    var
      canvas = imagediff.createCanvas(),
      context = canvas.getContext('2d');
    return context;
  }

  function newImage () {
    return isNode ? new Canvas.Image() : new Image();
  }

  function loadImage (url, callback) {
    var
      image = newImage();

    image.onload = function () {
      callback(image);
    };
    image.src = url;
  }

  function loadImageData (image, callback) {
    var
      canvas = imagediff.createCanvas(image.width, image.height),
      context = canvas.getContext('2d'),
      imageData;

      context.drawImage(image, 0, 0);
      imageData = context.getImageData(0, 0, image.width, image.height);

      callback(imageData);
  }

  function toImageDiffEqual () {
    return {
      compare: function (actual, expected) {
        var
          result = {},
          expectedData = expected.data,
          actualData = actual.data;

        result.pass = imagediff.equal(actual, expected);
        result.message = function () {
          var
            length = Math.min(expectedData.length, actualData.length),
            examples = '',
            count = 0,
            i;

          for (i = 0; i < length; i++) {
            if (expectedData[i] !== actualData[i]) {
              count++;
              if (count < 10) {
                examples += (examples ? ', ' : '') + 'Expected '+expectedData[i]+' to equal '+actualData[i]+' at '+i;
              }
            }
          }

          return 'Differed in ' + count + ' places. ' + examples;
        };
        return result;
      }
    };
  }

  function toBeImageData () {
    return {
      compare: function (actual) {
        return {
          pass: imagediff.isImageData(actual)
        };
      }
    };
  }

  // Creation Testing
  describe('Creation', function () {

    it('should create a canvas', function () {
      var
        canvas = imagediff.createCanvas();
      expect(typeof canvas).toEqual(OBJECT);
      expect(Object.prototype.toString.apply(canvas)).toEqual(TYPE_CANVAS);
    });

    it('should create a canvas with dimensions', function () {
      var
        canvas = imagediff.createCanvas(10, 20);
      expect(typeof canvas).toEqual(OBJECT);
      expect(Object.prototype.toString.apply(canvas)).toEqual(TYPE_CANVAS);
      expect(canvas.width).toEqual(10);
      expect(canvas.height).toEqual(20);
    });

    it('should create an imagedata object', function () {
      var
        imageData = imagediff.createImageData(10, 10);
      expect(typeof imageData).toEqual(OBJECT);
      expect(imageData.width).toBeDefined();
      expect(imageData.height).toBeDefined();
      expect(imageData.data).toBeDefined();
    });
  });


  // Types Testing
  describe('Types', function () {

    // Checking
    describe('Checking', function () {
      var
        image = newImage(),
        canvas = imagediff.createCanvas(),
        context = canvas.getContext('2d'),
        imageData = context.createImageData(30, 30);

      function testType (type, object) {
        return function () {
          expect(imagediff[type](null)).toEqual(false);
          expect(imagediff[type]('')).toEqual(false);
          expect(imagediff[type]({})).toEqual(false);
          expect(imagediff[type](object)).toEqual(true);
        };
      }

      it('should check Image type',     testType('isImage', image));
      it('should check Canvas type',    testType('isCanvas', canvas));
      it('should check 2DContext type', testType('isContext', context));
      it('should check ImageData type', testType('isImageData', imageData));
      it('should check for any of the image types', function () {
        expect(imagediff.isImageType(null)).toEqual(false);
        expect(imagediff.isImageType('')).toEqual(false);
        expect(imagediff.isImageType({})).toEqual(false);
        expect(imagediff.isImageType(image)).toEqual(true);
        expect(imagediff.isImageType(canvas)).toEqual(true);
        expect(imagediff.isImageType(context)).toEqual(true);
        expect(imagediff.isImageType(imageData)).toEqual(true);
      });
    });

    // Conversion
    describe('Conversion', function () {

      var
        image, imageData;

      beforeEach(function (done) {
        jasmine.addMatchers({
          toBeImageData : toBeImageData,
          toImageDiffEqual : toImageDiffEqual
        });

        loadImage('images/checkmark.png', function (theImage) {
          image = theImage;

          loadImageData(theImage, function (theImageData) {
            imageData = theImageData;

            done();
          });
        });

      });

      it('should convert Image to ImageData', function () {
        var
          result;

        result = imagediff.toImageData(image);
        expect(result).toBeImageData();
        expect(result).toImageDiffEqual(imageData);
      });

      it('should convert Canvas to ImageData', function () {
        var
          canvas = imagediff.createCanvas(),
          context = canvas.getContext('2d'),
          result;

        canvas.height = image.height;
        canvas.width = image.width;
        context.drawImage(image, 0, 0);

        result = imagediff.toImageData(canvas);

        expect(result).toBeImageData();
        expect(result).toImageDiffEqual(imageData);
      });

      it('should convert Context to ImageData', function () {
        var
          canvas = imagediff.createCanvas(),
          context = canvas.getContext('2d'),
          result = imagediff.toImageData(context);
        expect(result).toBeImageData();
      });

      it('should copy ImageData to new ImageData', function () {
        var
          result = imagediff.toImageData(imageData);
        expect(result).toBeImageData();
        expect(result).toImageDiffEqual(imageData);
        expect(imageData !== result).toBeTruthy();
      });

      it('should fail on non-ImageType', function () {
        expect(function () { imagediff.toImageData(); }).toThrow(E_TYPE);
        expect(function () { imagediff.toImageData(''); }).toThrow(E_TYPE);
        expect(function () { imagediff.toImageData({}); }).toThrow(E_TYPE);
      });
    });
  });


  // Equals Testing
  describe('Equals', function () {

    var context, a, b;

    beforeEach(function () {
      context = getContext();
      a = context.createImageData(2, 2);
    });

    it('should not be equal for equal ImageData', function () {
      b = context.createImageData(2, 2);
      expect(imagediff.equal(a, b)).toEqual(true);
    });

    it('should not be equal when one ImageData is of different width', function () {
      b = context.createImageData(3, 2);
      expect(imagediff.equal(a, b)).toEqual(false);
      expect(imagediff.equal(b, a)).toEqual(false);
    });

    it('should not be equal when one ImageData is of different height', function () {
      b = context.createImageData(2, 3);
      expect(imagediff.equal(a, b)).toEqual(false);
      expect(imagediff.equal(b, a)).toEqual(false);
    });

    it('should not be equal when one ImageData data array differs', function () {
      b = context.createImageData(2, 2);
      b.data[0] = 100;
      expect(imagediff.equal(a, b)).toEqual(false);
    });

    it('should be equal within optional tolerance', function () {
      b = context.createImageData(2, 2);
      b.data[0] = 100;
      expect(imagediff.equal(a, b, 101)).toEqual(true);
    });

    it('should be equal optional tolerance', function () {
      b = context.createImageData(2, 2);
      b.data[0] = 100;
      expect(imagediff.equal(a, b, 100)).toEqual(true);
    });

    it('should not be equal outside tolerance', function () {
      b = context.createImageData(2, 2);
      b.data[0] = 100;
      expect(imagediff.equal(a, b, 5)).toEqual(false);
    });
  });


  // Diff Testing
  describe('Diff', function () {

    var a, b, c, d;

    beforeEach(function () {
      jasmine.addMatchers({
        toImageDiffEqual : toImageDiffEqual
      });
    });

    describe('Geometry', function () {

      it('should be square, 1x1', function () {
        a = imagediff.createImageData(1, 1);
        b = imagediff.createImageData(1, 1);
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(1);
        expect(c.height).toEqual(1);
      });

      it('should be square, 2x2', function () {
        a = imagediff.createImageData(1, 2);
        b = imagediff.createImageData(2, 1);
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(2);
        expect(c.height).toEqual(2);
      });

      it('should be rectangular, 1x2', function () {
        a = imagediff.createImageData(1, 2);
        b = imagediff.createImageData(1, 1);
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(1);
        expect(c.height).toEqual(2);
      });

      it('should be rectangular, 2x1', function () {
        a = imagediff.createImageData(2, 1);
        b = imagediff.createImageData(1, 1);
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(2);
        expect(c.height).toEqual(1);
      });
    });

    describe('Difference', function () {

      it('should be black', function () {
        a = imagediff.createImageData(1, 1);
        b = imagediff.createImageData(1, 1);
        c = imagediff.diff(a, b);

        d = imagediff.createImageData(1, 1);
        d.data[3] = 255;

        expect(c).toImageDiffEqual(d);
      });

      it('should calculate difference', function () {
        a = imagediff.createImageData(1, 1);
        a.data[1] = 200;
        b = imagediff.createImageData(1, 1);
        b.data[1] = 158;
        c = imagediff.diff(a, b);

        d = imagediff.createImageData(1, 1);
        d.data[1] = 42;
        d.data[3] = 255;

        expect(c).toImageDiffEqual(d);
      });

      it('should center images of unequal size', function () {
        a = imagediff.createImageData(3, 3);
        b = imagediff.createImageData(1, 1);
        b.data[1] = 21;
        c = imagediff.diff(a, b);

        d = imagediff.createImageData(3, 3);
        // 4 * (rowPos * imageWidth + columnPos) + rgbPos
        d.data[4 * (1 * 3 + 1) + 1] = 21;
        // set alpha
        Array.prototype.forEach.call(d.data, function (value, i) {
          if (i % 4 === 3) {
            d.data[i] = 255;
          }
        });

        expect(c).toImageDiffEqual(d);
      });

      it('should optionally align images top left for unequal size', function () {
        a = imagediff.createImageData(3, 3);
        b = imagediff.createImageData(1, 1);
        b.data[1] = 21;
        c = imagediff.diff(a, b, {align: 'top'});

        d = imagediff.createImageData(3, 3);
        d.data[1] = 21;
        // set alpha
        Array.prototype.forEach.call(d.data, function (value, i) {
          if (i % 4 === 3) {
            d.data[i] = 255;
          }
        });

        expect(c).toImageDiffEqual(d);
      });
    });

    /*
    var
      a = imagediff.createImageData(1, 3),
      b = imagediff.createImageData(3, 1),
      c, d;

    a.data[0] = 255;
    a.data[3] = 255;
    a.data[4] = 255;
    a.data[7] = 255;
    a.data[8] = 255;
    a.data[11] = 255;

    b.data[0] = 255;
    b.data[3] = 255;
    b.data[4] = 255;
    b.data[7] = 255;
    b.data[8] = 255;
    b.data[11] = 255;
    */
  });


  // Jasmine Matcher Testing
  describe("jasmine.Matchers", function() {

    describe("toBeImageData", function () {
      it('should pass on imagedata', function () {
        var
          matcher = imagediff.jasmine.toBeImageData(),
          imageData = imagediff.createImageData(1, 1),
          result;

        result = matcher.compare(imageData);

        expect(result.pass).toBe(true);
      });

      it('should fail if not imagedata', function () {
        var
          matcher = imagediff.jasmine.toBeImageData(),
          result;

        result = matcher.compare({});

        expect(result.pass).toBe(false);
      });
    });

    describe("toImageDiffEqual", function () {
      var
        imageA, imageB, imageC;

      function contextForCanvasWithSizeOf (image) {
        return imagediff.createCanvas(image.width, image.height).getContext('2d');
      }

      beforeEach(function(done) {
        loadImage('images/xmark.png', function (theImageA) {
          imageA = theImageA;
          loadImage('images/xmark.png', function (theImageB) {
            imageB = theImageB;
            loadImage('images/checkmark.png', function (theImageC) {
              imageC = theImageC;
              done();
            });
          });
        });
      });

      it('should pass with similar images', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual(),
          result;

        result = matcher.compare(imageA, imageB);

        expect(result.pass).toBe(true);
      });

      it('should fail with different images', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual(),
          result;

        result = matcher.compare(imageB, imageC);

        expect(result.pass).toBe(false);
      });

      it('should throw an error if image is compared to an object without image content', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual();

        expect(function () {
          matcher.compare(imageA, {});
        }).toThrow(E_TYPE);
      });

      it('should pass with similar contexts (not a DOM element)', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual(),
          a = contextForCanvasWithSizeOf(imageA),
          b = contextForCanvasWithSizeOf(imageB),
          result;

        a.drawImage(imageA, 0, 0);
        b.drawImage(imageB, 0, 0);

        result = matcher.compare(a, b);

        expect(result.pass).toBe(true);
      });

      it('should fail with different contexts (not a DOM element)', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual(),
          a = contextForCanvasWithSizeOf(imageA),
          c = contextForCanvasWithSizeOf(imageC),
          result;

        a.drawImage(imageA, 0, 0);
        c.drawImage(imageC, 0, 0);

        result = matcher.compare(a, c);

        expect(result.pass).toBe(false);
      });

      it('should throw an error if context (not a DOM element) is compared to an object without image content', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual(),
          a = contextForCanvasWithSizeOf(imageA);

        a.drawImage(imageA, 0, 0);

        expect(function () {
          matcher.compare(a, {});
        }).toThrow(E_TYPE);
      });

      it('should pass with different images with negative comparison', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual(),
          result;

        result = matcher.negativeCompare(imageA, imageC);

        expect(result.pass).toBe(true);
      });

      it('should fail with similar images with negative comparison', function () {
        var
          matcher = imagediff.jasmine.toImageDiffEqual(),
          result;

        result = matcher.negativeCompare(imageA, imageB);

        expect(result.pass).toBe(false);
      });

      describe("toImageDiffEqual message", function () {

        if (isNode) { return; }

        beforeEach(function() {
          jasmine.addMatchers(imagediff.jasmine);
        });

        it('should show error message on failing', function () {
          var
            matcher = imagediff.jasmine.toImageDiffEqual(),
            message;

          message = matcher.compare(imageB, imageC).message();

          expect(message.querySelectorAll('div div div')[0].textContent).toEqual('Actual:');
          expect(message.querySelectorAll('div div canvas')[0]).toImageDiffEqual(imageB);

          expect(message.querySelectorAll('div div div')[1].textContent).toEqual('Expected:');
          expect(message.querySelectorAll('div div canvas')[1]).toImageDiffEqual(imageC);

          expect(message.querySelectorAll('div div div')[2].textContent).toEqual('Diff:');
          // TODO minimal difference fails the following
          // expect(message.querySelectorAll('div div canvas')[2]).toImageDiffEqual(imagediff.diff(imageB, imageC));
        });

        it('should show error message on failing for negative match', function () {
          var
            matcher = imagediff.jasmine.toImageDiffEqual(),
            message;

          message = matcher.negativeCompare(imageB, imageC).message;

          expect(message).toEqual('Expected not to be equal.');
        });
      });
    });
  });

  // Image Output
  describe('Image Output', function () {

    if (!isNode) { return; }

    var
      output = 'images/spec_output.png';

    beforeEach(function () {
      jasmine.addMatchers(imagediff.jasmine);
    });

    afterEach(function () {
      require('fs').unlink(output);
    });

    it('saves an image as a PNG', function (done) {

      var
        canvas = imagediff.createCanvas(10, 10),
        context = canvas.getContext('2d'),
        a, b;

      context.moveTo(0, 0);
      context.lineTo(10, 10);
      context.strokeStyle = 'rgba(150, 150, 150, .5)';
      context.stroke();
      a = context.getImageData(0, 0, 10, 10);

      imagediff.imageDataToPNG(a, output, function () {
        loadImage(output, function (image) {
          b = imagediff.toImageData(image);
          expect(b).toBeImageData();
          expect(canvas).toImageDiffEqual(b, 10);

          done();
        });
      });
    });
  });


  // Compatibility Testing
  describe('Compatibility', function () {

    var
      fn = Function,
      global = (fn('return this;')()), // Get the global object
      that = imagediff,
      reference;

    afterEach(function () {
      global.imagediff = that;
    });

    it('should remove imagediff from global space', function () {
      imagediff.noConflict();
      if (!isNode) {
        expect(imagediff === that).toEqual(false);
        expect(global.imagediff === that).toEqual(false);
      }
    });

    it('should return imagediff', function () {
      reference = imagediff.noConflict();
      expect(reference === that).toEqual(true);
    });

  });
});
