(function (name, definition) {
  var root = this;
  if (typeof module !== 'undefined') {
    var createCanvas;
    try {
      Canvas = require('canvas');
    } catch (e) {}
    module.exports = definition(root, name, Canvas);
  } else if (typeof define === 'function' && typeof define.amd === 'object') {
    define(definition(root, name));
  } else {
    root[name] = definition(root, name);
  }
})('imagediff', function (root, name, Canvas) {

  var
    TYPE_ARRAY        = /\[object Array\]/i,
    TYPE_CANVAS       = /\[object (Canvas|HTMLCanvasElement)\]/i,
    TYPE_CONTEXT      = /\[object CanvasRenderingContext2D\]/i,
    TYPE_IMAGE        = /\[object (Image|HTMLImageElement)\]/i,
    TYPE_IMAGE_DATA   = /\[object ImageData\]/i,

    UNDEFINED         = 'undefined',

    canvas            = getCanvas(),
    context           = canvas.getContext('2d'),
    previous          = root[name],
    imagediff, jasmine;

  // Creation
  function getCanvas (width, height) {
    var canvas;
    if (Canvas) {
      canvas = Canvas.createCanvas(width, height);
    } else if (root.document && root.document.createElement) {
      canvas = document.createElement('canvas');
      if (width) canvas.width = width;
      if (height) canvas.height = height;
    } else {
      throw new Error(
        e.message + '\n' +
        'Please see https://github.com/HumbleSoftware/js-imagediff#cannot-find-module-canvas\n'
      );
    }
    return canvas;
  }
  function getImageData (width, height) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    return context.createImageData(width, height);
  }

  // expose canvas module
  function getCanvasRef() {
    return Canvas;
  }


  // Type Checking
  function isImage (object) {
    return isType(object, TYPE_IMAGE);
  }
  function isCanvas (object) {
    return isType(object, TYPE_CANVAS);
  }
  function isContext (object) {
    return isType(object, TYPE_CONTEXT);
  }
  function isImageData (object) {
    return !!(object &&
      isType(object, TYPE_IMAGE_DATA) &&
      typeof(object.width) !== UNDEFINED &&
      typeof(object.height) !== UNDEFINED &&
      typeof(object.data) !== UNDEFINED);
  }
  function isImageType (object) {
    return (
      isImage(object) ||
      isCanvas(object) ||
      isContext(object) ||
      isImageData(object)
    );
  }
  function isType (object, type) {
    return typeof (object) === 'object' && !!Object.prototype.toString.apply(object).match(type);
  }


  // Type Conversion
  function copyImageData (imageData) {
    var
      height = imageData.height,
      width = imageData.width,
      data = imageData.data,
      newImageData, newData, i;

    canvas.width = width;
    canvas.height = height;
    newImageData = context.getImageData(0, 0, width, height);
    newData = newImageData.data;

    for (i = imageData.data.length; i--;) {
        newData[i] = data[i];
    }

    return newImageData;
  }
  function toImageData (object) {
    if (isImage(object)) { return toImageDataFromImage(object); }
    if (isCanvas(object)) { return toImageDataFromCanvas(object); }
    if (isContext(object)) { return toImageDataFromContext(object); }
    if (isImageData(object)) { return object; }
  }
  function toImageDataFromImage (image) {
    var
      height = image.height,
      width = image.width;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, width, height);
  }
  function toImageDataFromCanvas (canvas) {
    var
      height = canvas.height,
      width = canvas.width,
      context = canvas.getContext('2d');
    return context.getImageData(0, 0, width, height);
  }
  function toImageDataFromContext (context) {
    var
      canvas = context.canvas,
      height = canvas.height,
      width = canvas.width;
    return context.getImageData(0, 0, width, height);
  }
  function toCanvas (object) {
    var
      data = toImageData(object),
      canvas = getCanvas(data.width, data.height),
      context = canvas.getContext('2d');

    context.putImageData(data, 0, 0);
    return canvas;
  }


  // ImageData Equality Operators
  function equalWidth (a, b) {
    return a.width === b.width;
  }
  function equalHeight (a, b) {
    return a.height === b.height;
  }
  function equalDimensions (a, b) {
    return equalHeight(a, b) && equalWidth(a, b);
  }
  function equal (a, b, tolerance) {

    var
      aData     = a.data,
      bData     = b.data,
      length    = aData.length,
      i;

    tolerance = tolerance || 0;

    if (!equalDimensions(a, b)) return false;
    for (i = length; i--;) if (aData[i] !== bData[i] && Math.abs(aData[i] - bData[i]) > tolerance) return false;

    return true;
  }


  // Diff
  function diff (a, b, options) {
    return (equalDimensions(a, b) ? diffEqual : diffUnequal)(a, b, options);
  }
  function diffEqual (a, b, options) {

    var
      height  = a.height,
      width   = a.width,
      c       = getImageData(width, height), // c = a - b
      aData   = a.data,
      bData   = b.data,
      cData   = c.data,
      length  = cData.length,
      row, column,
      i, j, k, v;

    for (i = 0; i < length; i += 4) {
      var pixelA = Array.prototype.slice.call(aData, i, i+3);
      var pixelB = Array.prototype.slice.call(bData, i, i+3);
      var pixelC = diffPixels(pixelA, pixelB, options);
      for (var rgbIndex = 0; rgbIndex < 4; rgbIndex++) {
        cData[i+rgbIndex] = pixelC[rgbIndex];
      }
    }

    return c;
  }
  function diffUnequal (a, b, options) {

    var
      height  = Math.max(a.height, b.height),
      width   = Math.max(a.width, b.width),
      c       = getImageData(width, height), // c = a - b
      aData   = a.data,
      bData   = b.data,
      cData   = c.data,
      align   = options && options.align,
      rowOffset,
      columnOffset,
      row, column,
      i, j, k, v;


    for (i = cData.length - 1; i > 0; i = i - 4) {
      cData[i] = 255;
    }

    // Add First Image
    offsets(a);
    for (row = a.height; row--;){
      for (column = a.width; column--;) {
        i = 4 * ((row + rowOffset) * width + (column + columnOffset));
        j = 4 * (row * a.width + column);
        cData[i+0] = aData[j+0]; // r
        cData[i+1] = aData[j+1]; // g
        cData[i+2] = aData[j+2]; // b
      }
    }

    // Subtract Second Image
    offsets(b);
    for (row = b.height; row--;){
      for (column = b.width; column--;) {
        i = 4 * ((row + rowOffset) * width + (column + columnOffset));
        j = 4 * (row * b.width + column);
        var pixelA = Array.prototype.slice.call(cData, i, i+3);
        var pixelB = Array.prototype.slice.call(bData, j, j+3);
        var pixelC = diffPixels(pixelA, pixelB, options);
        for (var rgbIndex = 0; rgbIndex < 4; rgbIndex++) {
          cData[i+rgbIndex] = pixelC[rgbIndex];
        }
      }
    }

    // Helpers
    function offsets (imageData) {
      if (align === 'top') {
        rowOffset = 0;
        columnOffset = 0;
      } else {
        rowOffset = Math.floor((height - imageData.height) / 2);
        columnOffset = Math.floor((width - imageData.width) / 2);
      }
    }

    return c;
  }

  /**
   * Differentiates two rgb pixels by subtracting color values.
   * @see https://github.com/HumbleSoftware/js-imagediff/pull/52
   *
   * @param {Object} options
   *   options.lightboost: increases differences visibility with a light boost.
   *   options.diffColor: a rgb array used to specify differences color instead of light gap.
   *   options.stack: stacks differences on top of the original image, preserving common pixels.
   *
   * @returns {Array} pixel rgba values between 0 and 255.
   */
  function diffPixels(pixelA, pixelB, options) {
    var lightboost = options && options.lightboost || 0;
    var diffColor = options && options.diffColor || false;
    var stack = options && options.stack || false;
    // pixel = [r,g,b,a]
    var pixelC = [0,0,0,255];
    for (var rgbIndex = 0; rgbIndex < 3 ; rgbIndex++) {
      pixelC[rgbIndex] = Math.abs(pixelA[rgbIndex] - pixelB[rgbIndex]);
      if (pixelC[rgbIndex] > 0) {
        if (diffColor) pixelC[rgbIndex] = diffColor[rgbIndex];
        pixelC[rgbIndex] = Math.min(pixelC[rgbIndex] + lightboost, 255);
      }
      else if (stack) {
        pixelC[rgbIndex] = pixelA[rgbIndex];
      }
    }
    return pixelC;
  }

  // Validation
  function checkType () {
    var i;
    for (i = 0; i < arguments.length; i++) {
      if (!isImageType(arguments[i])) {
        throw {
          name : 'ImageTypeError',
          message : 'Submitted object was not an image.'
        };
      }
    }
  }


  // Jasmine Matchers
  function get (element, content) {
    element = document.createElement(element);
    if (element && content) {
      element.innerHTML = content;
    }
    return element;
  }

  function formatImageDiffEqualReport (actual, expected) {
    if (typeof (document) !== 'undefined') {
      return formatImageDiffEqualHtmlReport(actual, expected);
    } else {
      return formatImageDiffEqualTextReport(actual, expected);
    }
  }

  function formatImageDiffEqualHtmlReport (actual, expected) {
    var
      div     = get('div', '<span>Expected to be equal.'),
      a       = get('div', '<div>Actual:</div>'),
      b       = get('div', '<div>Expected:</div>'),
      c       = get('div', '<div>Diff:</div>'),
      diff    = imagediff.diff(actual, expected),
      canvas  = getCanvas(),
      context;

    canvas.height = diff.height;
    canvas.width  = diff.width;

    div.style.overflow = 'hidden';
    a.style.float = 'left';
    b.style.float = 'left';
    c.style.float = 'left';

    context = canvas.getContext('2d');
    context.putImageData(diff, 0, 0);

    a.appendChild(toCanvas(actual));
    b.appendChild(toCanvas(expected));
    c.appendChild(canvas);

    div.appendChild(a);
    div.appendChild(b);
    div.appendChild(c);

    return div.innerHTML;
  }

  function formatImageDiffEqualTextReport (actual, expected) {
    return 'Expected to be equal.';
  }

  jasmine = {
    toBeImageData : function () {
      return {
        compare: function (actual, expected) {
          var pass = imagediff.isImageData(actual);
          return {
            pass: pass,
            message: pass ? 'Is ImageData' : 'Is not ImageData'
          }
        }
      }
    },

    toImageDiffEqual : function () {
      return {
        compare: function (actual, expected, tolerance) {
          var pass = imagediff.equal(actual, expected, tolerance);
          return {
            pass: pass,
            message: pass
              ? 'Expected not to be equal.'
              : formatImageDiffEqualReport(actual, expected)
          };
        }
      }
    }
  };


  // Image Output
  function imageDataToPNG (imageData, outputFile, callback) {

    var
      canvas = toCanvas(imageData),
      base64Data,
      decodedImage;

    callback = callback || Function;

    base64Data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/,"");
    decodedImage = Buffer.from(base64Data, 'base64');
    require('fs').writeFile(outputFile, decodedImage, callback);
  }


  // Definition
  imagediff = {

    createCanvas : getCanvas,
    createImageData : getImageData,
    getCanvasRef : getCanvasRef,

    isImage : isImage,
    isCanvas : isCanvas,
    isContext : isContext,
    isImageData : isImageData,
    isImageType : isImageType,

    toImageData : function (object) {
      checkType(object);
      if (isImageData(object)) { return copyImageData(object); }
      return toImageData(object);
    },

    equal : function (a, b, tolerance) {
      checkType(a, b);
      a = toImageData(a);
      b = toImageData(b);
      return equal(a, b, tolerance);
    },
    diff : function (a, b, options) {
      checkType(a, b);
      a = toImageData(a);
      b = toImageData(b);
      return diff(a, b, options);
    },

    jasmine : jasmine,

    // Compatibility
    noConflict : function () {
      root[name] = previous;
      return imagediff;
    }
  };

  if (typeof module !== 'undefined') {
    imagediff.imageDataToPNG = imageDataToPNG;
  }

  return imagediff;
});
