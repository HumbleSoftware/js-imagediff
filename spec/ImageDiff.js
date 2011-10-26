describe('ImageUtils', function() {

  var
    OBJECT            = 'object',
    TYPE_CANVAS       = '[object HTMLCanvasElement]',
    TYPE_IMAGE_DATA   = '[object ImageData]';

  function getContext () {
    var
      canvas = imagediff.createCanvas(),
      context = canvas.getContext('2d');
    return context;
  }


  // Creation Testing
  describe('Creation', function () {

    it('should create a canvas', function () {
      var
        canvas = imagediff.createCanvas();
      expect(typeof canvas).toEqual(OBJECT);
      expect(Object.prototype.toString.apply(canvas)).toEqual(TYPE_CANVAS);
    });

    it('should create an imagedata object', function () {
      var
        imageData = imagediff.createImageData(10, 10);
      expect(typeof imageData).toEqual(OBJECT);
      expect(Object.prototype.toString.apply(imageData)).toEqual(TYPE_IMAGE_DATA);
    });
  });


  // Types Testing
  describe('Types', function () {

    // Checking
    describe('Checking', function () {
      var
        image = new Image(),
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
        image = new Image(),
        imageData;

      beforeEach(function () {
        this.addMatchers({
          toBeImageData : function () {
            return imagediff.isImageData(this.actual);
          },
          toImageDiffEqual : function (expected) {
            return imagediff.equal(this.actual, expected);
          }
        });
      });

      it('should convert Image to ImageData', function () {

        var
          result;

        image.src = 'images/checkmark.png';
        waitsFor(function () {
          return image.complete;
        }, 'image not loaded.', 1000);

        runs(function () {
          var
            canvas = imagediff.createCanvas(),
            context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
          imageData = context.getImageData(0, 0, image.width, image.height);

          result = imagediff.toImageData(image);
          expect(result).toBeImageData();
          expect(result).toImageDiffEqual(imageData);
        });
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
        result = imagediff.toImageData(imageData);
        expect(result).toBeImageData();
        expect(result).toImageDiffEqual(imageData);
        expect(imageData !== result).toBeTruthy();
      });

      it('should fail on non-ImageType', function () {
        var
          e = { name : 'ImageTypeError', message : 'Submitted object was not an image.' };

        expect(function () { imagediff.toImageData() }).toThrow(e);
        expect(function () { imagediff.toImageData('') }).toThrow(e);
        expect(function () { imagediff.toImageData({}) }).toThrow(e);
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
  });


  // Diff Testing
  describe('Diff', function () {

    var a, b, c, d;

    beforeEach(function () {
      this.addMatchers({
        toImageDiffEqual : function (expected) {
          return imagediff.equal(this.actual, expected);
        }
      });
    });

    describe('Geometry', function () {

      it('should be square, 1x1', function () {
        a = imagediff.createImageData(1, 1),
        b = imagediff.createImageData(1, 1),
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(1);
        expect(c.height).toEqual(1);
      });

      it('should be square, 2x2', function () {
        a = imagediff.createImageData(1, 2),
        b = imagediff.createImageData(2, 1),
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(2);
        expect(c.height).toEqual(2);
      });

      it('should be rectangular, 1x2', function () {
        a = imagediff.createImageData(1, 2),
        b = imagediff.createImageData(1, 1),
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(1);
        expect(c.height).toEqual(2);
      });

      it('should be rectangular, 2x1', function () {
        a = imagediff.createImageData(2, 1),
        b = imagediff.createImageData(1, 1),
        c = imagediff.diff(a, b);

        expect(c.width).toEqual(2);
        expect(c.height).toEqual(1);
      });
    });

    describe('Difference', function () {

      it('should be black', function () {
        a = imagediff.createImageData(1, 1),
        b = imagediff.createImageData(1, 1),
        c = imagediff.diff(a, b);

        d = imagediff.createImageData(1, 1);
        d.data[3] = 255;

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
      expect(imagediff === that).toEqual(false);
      expect(global.imagediff === that).toEqual(false);
    });

    it('should return imagediff', function () {
      reference = imagediff.noConflict();
      expect(reference === that).toEqual(true);
    });

  });
});
