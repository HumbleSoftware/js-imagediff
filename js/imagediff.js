(function (name, definition) {
  // `this` is undefined when a bundler wraps the file in strict mode.
  var root = this || (typeof window !== 'undefined' ? window : {});
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

    canvas, context,
    previous          = root[name],
    imagediff, jasmine, jasmineReporter;

  // Creation
  function getCanvas (width, height) {
    var canvas;
    if (Canvas) {
      canvas = Canvas.createCanvas(width, height);
    } else if (typeof document !== UNDEFINED && document.createElement) {
      canvas = document.createElement('canvas');
      if (width) canvas.width = width;
      if (height) canvas.height = height;
    } else {
      throw new Error(
        'Cannot find module \'canvas\'.\n' +
        'Please see https://github.com/HumbleSoftware/js-imagediff#cannot-find-module-canvas\n'
      );
    }
    return canvas;
  }
  // Shared scratch canvas, created on first use so loading the library
  // doesn't require a canvas implementation.
  function getScratchContext (width, height) {
    if (!context) {
      canvas = getCanvas();
      context = canvas.getContext('2d');
    }
    canvas.width = width;
    canvas.height = height;
    return context;
  }
  function getImageData (width, height) {
    var context = getScratchContext(width, height);
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
      context = getScratchContext(width, height),
      newImageData, newData, i;

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
      width = image.width,
      context = getScratchContext(width, height);
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
      cData[i] = Math.abs(aData[i] - bData[i]);
      cData[i+1] = Math.abs(aData[i+1] - bData[i+1]);
      cData[i+2] = Math.abs(aData[i+2] - bData[i+2]);
      cData[i+3] = Math.abs(255 - Math.abs(aData[i+3] - bData[i+3]));
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

    // Jasmine passes its matcher utilities to this factory for each
    // expectation. A direct call without them keeps no images.
    toImageDiffEqual : function (util) {
      function comparer (not) {
        return function (actual, expected, tolerance) {
          var equal = imagediff.equal(actual, expected, tolerance);
          if (util && equal === not) keepImages(actual, expected);
          return {
            pass: equal !== not,
            message: equal
              ? 'Expected not to be equal.'
              : 'Expected to be equal.'
          };
        };
      }
      return {
        compare: comparer(false),
        // Used by .not, so that its failures are known here too.
        negativeCompare: comparer(true)
      };
    }
  };


  // Jasmine Reporter
  //
  // A matcher can only give Jasmine a string, so the images of a failed
  // toImageDiffEqual can't travel with its message. Instead the matcher keeps
  // copies of them for the spec or suite that is running, and this reporter
  // draws them into Jasmine's HTML report, under the message of the failure.
  var
    report,           // root element of Jasmine's HTML report, once it's found
    observer,
    spec,             // id of the running spec
    suites  = [],     // ids of the running suites, innermost last
    kept    = {},     // images of failed matchers, by spec or suite id
    failed  = [],     // failed specs and suites the report hasn't listed yet
    listed  = 0;      // failures of the report that are dealt with

  function keepImages (actual, expected) {
    // Failures outside of every suite aren't listed with the others.
    var id = report && (spec || suites[suites.length - 1]);
    if (!id) return;
    (kept[id] = kept[id] || []).push({
      actual: toCanvas(actual),
      expected: toCanvas(expected),
      diff: toCanvas(imagediff.diff(actual, expected))
    });
  }

  // Lines up the failed expectations of a finished spec or suite with the
  // images kept while it ran.
  function finish (result) {
    var
      images = kept[result.id] || [],
      expectations = result.failedExpectations || [],
      failure = { description: result.description, messages: [], images: [] },
      count = 0,
      i;

    delete kept[result.id];
    if (!report || result.status !== 'failed') return;

    for (i = 0; i < expectations.length; i++) {
      failure.messages.push(expectations[i].message);
      if (expectations[i].matcherName === 'toImageDiffEqual') {
        failure.images[i] = images[count++];
      }
    }
    // Better no images than the images of another failure.
    if (count !== images.length) failure.images = [];

    failed.push(failure);
    draw(); // the report may list it already
  }

  // The report lists one failure for each failed spec and suite, in order.
  function draw () {
    var details = report.querySelectorAll('.jasmine-failures .jasmine-spec-detail');
    while (failed.length && listed < details.length) {
      drawFailure(details[listed++], failed.shift());
    }
  }

  function drawFailure (detail, failure) {
    var
      links = detail.querySelectorAll('.jasmine-description a'),
      messages = detail.querySelectorAll('.jasmine-result-message'),
      i;

    // Check that the report lists this failure here before drawing on it.
    if (!links.length || links[links.length - 1].textContent !== failure.description) return;
    if (messages.length !== failure.messages.length) return;
    for (i = 0; i < messages.length; i++) {
      if (messages[i].textContent !== failure.messages[i]) return;
    }

    for (i = 0; i < messages.length; i++) {
      if (failure.images[i]) {
        messages[i].parentNode.insertBefore(
          imagesElement(failure.images[i]),
          messages[i].nextSibling
        );
      }
    }
  }

  function imagesElement (images) {
    var element = document.createElement('div');
    element.className = 'imagediff-images';
    element.style.padding = '5px 9px 0'; // in line with the message
    element.appendChild(imageElement('Actual', images.actual));
    element.appendChild(imageElement('Expected', images.expected));
    element.appendChild(imageElement('Diff', images.diff));
    return element;
  }

  function imageElement (label, canvas) {
    var
      element = document.createElement('div'),
      caption = document.createElement('div');

    element.className = 'imagediff-' + label.toLowerCase();
    element.style.display = 'inline-block';
    element.style.verticalAlign = 'top';
    element.style.marginRight = '10px';
    caption.appendChild(document.createTextNode(label + ':'));
    element.appendChild(caption);
    element.appendChild(canvas);
    return element;
  }

  jasmineReporter = {
    jasmineStarted : function () {
      if (observer) observer.disconnect();
      // Without an HTML report, or a way to watch it, there's nothing to do.
      report = typeof document !== UNDEFINED &&
        typeof MutationObserver !== UNDEFINED &&
        document.querySelector('.jasmine_html-reporter');
      spec = null;
      suites = [];
      kept = {};
      failed = [];
      listed = 0;
      // Jasmine may call this reporter before its own, and may list the
      // failures only at the end, so draw whenever the report changes.
      if (report) {
        observer = new MutationObserver(draw);
        observer.observe(report, { childList: true, subtree: true });
      }
    },
    suiteStarted : function (result) {
      suites.push(result.id);
    },
    specStarted : function (result) {
      spec = result.id;
    },
    specDone : function (result) {
      spec = null;
      finish(result);
    },
    suiteDone : function (result) {
      suites.pop();
      finish(result);
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
    jasmineReporter : jasmineReporter,

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
