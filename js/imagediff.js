(function (name, definition) {
  var root = this;
  if (typeof module !== 'undefined') {
    var Canvas;
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
      canvas = new Canvas();
    } else if (root.document && root.document.createElement) {
      canvas = document.createElement('canvas');
    } else {
        throw new Error(
          e.message + '\n' +
          'Please see https://github.com/HumbleSoftware/js-imagediff#cannot-find-module-canvas\n'
        );
    }
    if (width) canvas.width = width;
    if (height) canvas.height = height;
    return canvas;
  }
  function getImageData (width, height) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    return context.createImageData(width, height);
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

  // Image mask generation


  function fillArray(array, value, start, end) {
    var i,
        i0 = (start !== undefined) ? start : 0,
        i1 = (end !== undefined) ? end : array.length;
    if(Array.prototype.fill) {
      return array.fill(value, start, end);
    }
    for(i = i0; i < i1; i += 1) {
      array[i] = value;
    }
    return array;
  }
  /*
    region format: [x0, y0, x1, y1, include]
  */
  function createMask (width, height, regions) {
    var
      array   = fillArray(Array(width * height), false),
      i, y, region;

    for(i = 0; i < regions.length; i += 1) {
      region = regions[i];
      for(y = region[1]; y < region[3]; y += 1) {
        fillArray(array, region[4], y * width + region[0], y * width + region[2]);
      }
    }
    return array;
  }
  function displayMask(width, height, regions) {
    var
      mask    = createMask(width, height, regions),
      image   = getImageData(width, height),
      iData   = image.data,
      length  = mask.length,
      i, ii, color;

    for (i = 0, ii = 0; i < length; i += 1, ii += 4) {
      color = mask[i] ? 255 : 0;
      iData[ii]   = color;
      iData[ii+1] = color;
      iData[ii+2] = color;
      iData[ii+3] = 255;

      if(!(mask[i] === true || mask[i] === false)) {
        iData[ii]   = 255;
        iData[ii+1] = 0;
        iData[ii+2] = 0;
      }
    }

    return image;
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
  function equal (a, b, tolerance, options) {

    var
      aData     = a.data,
      bData     = b.data,
      length    = aData.length / 4,
      mask      = null,
      i, ii, j;

    tolerance = tolerance || 0;
    options   = options || {};

    if (!equalDimensions(a, b)) return false;

    if(options.regions) {
      mask = createMask(a.width, a.height, options.regions);
    }

    for (i = 0; i < length; i += 1) {
      if (mask && !mask[i]) continue;
      for(j = 0, ii = i * 4; j < 4; j += 1, ii += 1)
        if (aData[ii] !== bData[ii] &&
            Math.abs(aData[ii] - bData[ii]) > tolerance) {
          return false;
        }
    }

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
      mask    = null,
      row, column,
      i, ii, j, k, v;

    if(options.regions && options.mask) {
      mask = createMask(width, height, options.regions);
    }

    for (i = 0, ii = 0; ii < length; i += 1, ii += 4) {
      if(mask && !mask[i]) {
        cData[ii]   = 0;
        cData[ii+1] = 0;
        cData[ii+2] = 92;
        cData[ii+3] = 255;
      } else {
        cData[ii]   = Math.abs(aData[ii] - bData[ii]);
        cData[ii+1] = Math.abs(aData[ii+1] - bData[ii+1]);
        cData[ii+2] = Math.abs(aData[ii+2] - bData[ii+2]);
        cData[ii+3] = Math.abs(255 - Math.abs(aData[ii+3] - bData[ii+3]));
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
        // cData[i+3] = aData[j+3]; // a
      }
    }

    // Subtract Second Image
    offsets(b);
    for (row = b.height; row--;){
      for (column = b.width; column--;) {
        i = 4 * ((row + rowOffset) * width + (column + columnOffset));
        j = 4 * (row * b.width + column);
        cData[i+0] = Math.abs(cData[i+0] - bData[j+0]); // r
        cData[i+1] = Math.abs(cData[i+1] - bData[j+1]); // g
        cData[i+2] = Math.abs(cData[i+2] - bData[j+2]); // b
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

  jasmine = {

    toBeImageData : function () {
      return imagediff.isImageData(this.actual);
    },

    toImageDiffEqual : function (expected, tolerance) {

      if (typeof (document) !== UNDEFINED) {
        this.message = function () {
          var
            div     = get('div'),
            a       = get('div', '<div>Actual:</div>'),
            b       = get('div', '<div>Expected:</div>'),
            c       = get('div', '<div>Diff:</div>'),
            diff    = imagediff.diff(this.actual, expected),
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

          a.appendChild(toCanvas(this.actual));
          b.appendChild(toCanvas(expected));
          c.appendChild(canvas);

          div.appendChild(a);
          div.appendChild(b);
          div.appendChild(c);

          return [
            div,
            "Expected not to be equal."
          ];
        };
      }

      return imagediff.equal(this.actual, expected, tolerance);
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
    decodedImage = new Buffer(base64Data, 'base64');
    require('fs').writeFile(outputFile, decodedImage, callback);
  }


  // Definition
  imagediff = {

    createCanvas : getCanvas,
    createImageData : getImageData,

    displayMask : displayMask,

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

    equal : function (a, b, tolerance, options) {
      checkType(a, b);
      a = toImageData(a);
      b = toImageData(b);
      return equal(a, b, tolerance, options);
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
