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
    imagediff, jasmine, jasmineReporter,

    // Jasmine reporter state
    report,                 // Jasmine's HTML report, while the reporter runs
    scopes            = [], // images recorded by the running spec and suites
    pending           = [], // failures the report hasn't drawn yet
    observer;

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

    toImageDiffEqual : function () {
      return {
        compare: function (actual, expected, tolerance) {
          var pass = imagediff.equal(actual, expected, tolerance);
          if (!pass) recordImages(actual, expected);
          return {
            pass: pass,
            message: pass
              ? 'Expected not to be equal.'
              : 'Expected to be equal.'
          };
        },
        // With this, compare only runs for expectations without `.not`, so
        // every recording belongs to a failure.
        negativeCompare: function (actual, expected, tolerance) {
          var pass = !imagediff.equal(actual, expected, tolerance);
          if (!pass) recordImages(actual, expected);
          return {
            pass: pass,
            message: 'Expected not to be equal.'
          };
        }
      }
    }
  };


  // Jasmine Reporter
  //
  // A matcher's message is plain text, so the images of a failed
  // toImageDiffEqual travel separately: the matcher records them, and this
  // reporter adds them under the failure's message in Jasmine's HTML report.
  // Without that report (in Node.js, say) nothing is recorded.
  jasmineReporter = {
    jasmineStarted : function () {
      if (observer) observer.disconnect();
      report = typeof document !== UNDEFINED &&
        document.querySelector('.jasmine_html-reporter');
      scopes = [];
      pending = [];
      // Jasmine's own reporter may hear of a failure, and draw it, after this
      // one has.
      if (report && typeof MutationObserver !== UNDEFINED) {
        observer = new MutationObserver(showImages);
        observer.observe(report, { childList: true, subtree: true });
      }
    },
    suiteStarted : startScope,
    specStarted : startScope,
    specDone : finishScope,
    suiteDone : finishScope,
    jasmineDone : showImages
  };

  // Called by a failing toImageDiffEqual. Copies the pixels, so the report
  // shows the images as they were when compared.
  function recordImages (actual, expected) {
    var
      scope = scopes[scopes.length - 1],
      a, b;

    if (scope) {
      a = toImageData(actual);
      b = toImageData(expected);
      scope.images.push([toCanvas(a), toCanvas(b), toCanvas(diff(a, b))]);
    }
  }

  // A scope is a running spec or suite. A suite's scope is the last one
  // while its beforeAll and afterAll run.
  function startScope (result) {
    if (report) scopes.push({ id : result.id, images : [] });
  }
  function finishScope (result) {
    var
      scope = scopes.pop(),
      expectations = result.failedExpectations,
      failure = { name : result.fullName, messages : [], images : [] },
      count = 0,
      isImage, i;

    if (!scope) return;
    if (scope.id !== result.id) {
      // Not the spec or suite that started last, so don't guess whose
      // images these are.
      scopes = [];
      return;
    }

    // The report lists failed specs and suites only.
    if (result.status !== 'failed') return;

    for (i = 0; i < expectations.length; i++) {
      isImage = expectations[i].matcherName === 'toImageDiffEqual';
      failure.messages.push(expectations[i].message);
      failure.images.push(isImage ? scope.images[count++] : null);
    }

    // Recordings and failures pair up in order, as long as there is one of
    // each. If not, show no images rather than risk the wrong ones.
    if (count && count === scope.images.length) {
      pending.push(failure);
      showImages();
    }
  }

  // Adds the images of the pending failures that the report has drawn.
  function showImages () {
    var details;

    if (!pending.length) return;
    details = report.querySelectorAll('.jasmine-failures .jasmine-spec-detail');
    pending = pending.filter(function (failure) {
      var i;
      for (i = 0; i < details.length; i++) {
        if (showFailure(details[i], failure)) return false;
      }
      return true;
    });
  }
  // Adds a failure's images to one failed spec or suite in the report, if it
  // is that failure: the same name and messages, and no images yet.
  function showFailure (detail, failure) {
    var
      description = detail.querySelector('.jasmine-description'),
      messages = detail.querySelectorAll('.jasmine-result-message'),
      i;

    if (
      !description ||
      joinName(description.textContent) !== joinName(failure.name) ||
      messages.length !== failure.messages.length ||
      detail.querySelector('.imagediff')
    ) return false;
    for (i = 0; i < messages.length; i++) {
      if (messages[i].textContent !== failure.messages[i]) return false;
    }

    for (i = 0; i < messages.length; i++) {
      if (failure.images[i]) {
        messages[i].parentNode.insertBefore(
          imagesElement(failure.images[i]),
          messages[i].nextSibling
        );
      }
    }
    return true;
  }
  // The report joins suite and spec names with ' > ', and a result's full
  // name joins them with ' '.
  function joinName (name) {
    return name.replace(/ > /g, ' ');
  }
  function imagesElement (images) {
    var
      labels = ['Actual', 'Expected', 'Diff'],
      element = document.createElement('div'),
      image, label, i;

    element.className = 'imagediff';
    // Line up with the message above.
    element.style.cssText = 'padding: 5px 9px 0;';
    for (i = 0; i < labels.length; i++) {
      image = document.createElement('div');
      image.className = 'imagediff-' + labels[i].toLowerCase();
      image.style.cssText = 'display: inline-block; margin-right: 10px; vertical-align: top;';
      label = document.createElement('div');
      label.appendChild(document.createTextNode(labels[i]));
      image.appendChild(label);
      image.appendChild(images[i]);
      element.appendChild(image);
    }
    return element;
  }


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
