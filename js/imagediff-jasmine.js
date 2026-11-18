(function (definition) {
  // An add-on to imagediff: load it after imagediff itself.
  // `this` is undefined when a bundler wraps the file in strict mode.
  var root = this || (typeof window !== 'undefined' ? window : {});
  if (typeof module !== 'undefined') {
    module.exports = definition(require('./imagediff'));
  } else if (typeof define === 'function' && typeof define.amd === 'object') {
    define(['imagediff'], definition);
  } else {
    definition(root.imagediff);
  }
})(function (imagediff) {

  // Jasmine Reporter
  //
  // A matcher can only give Jasmine a string, so the images of a failed
  // toImageDiffEqual can't travel with its message. Instead the matcher keeps
  // copies of them for the spec or suite that is running, and this reporter
  // draws them into Jasmine's HTML report, under the message of the failure.

  var
    UNDEFINED = 'undefined',

    report,           // root element of Jasmine's HTML report, once it's found
    observer,
    spec,             // id of the running spec
    suites  = [],     // ids of the running suites, innermost last
    kept    = {},     // images of failed matchers, by spec or suite id
    failed  = [],     // failed specs and suites the report hasn't listed yet
    listed  = 0,      // failures of the report that are dealt with

    jasmineReporter;

  if (!imagediff) {
    throw new Error('imagediff-jasmine needs imagediff: load imagediff first.');
  }

  // Copies an image into a new canvas, so it keeps its pixels as they were.
  function toCanvas (object) {
    var
      data = imagediff.toImageData(object),
      canvas = imagediff.createCanvas(data.width, data.height);

    canvas.getContext('2d').putImageData(data, 0, 0);
    return canvas;
  }

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


  // Jasmine Matcher
  //
  // Takes the place of imagediff's own toImageDiffEqual, with the same
  // results and messages, and keeps the images of each failure for the
  // reporter. Jasmine passes its matcher utilities to this factory for each
  // expectation. A direct call without them keeps no images.
  imagediff.jasmine.toImageDiffEqual = function (util) {
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
  };

  imagediff.jasmineReporter = jasmineReporter;

  return imagediff;
});
