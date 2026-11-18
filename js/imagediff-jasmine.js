(function (definition) {
  // An add-on to imagediff: load it after imagediff itself.
  // `this` is undefined when a bundler wraps the file in strict mode.
  var root = this || (typeof window !== 'undefined' ? window : {});
  if (typeof module !== 'undefined') {
    module.exports = definition(require('./imagediff'));
  } else if (typeof define === 'function' && typeof define.amd === 'object') {
    define(['imagediff'], definition);
  } else {
    root.imagediffJasmine = definition(root.imagediff);
  }
})(function (imagediff) {

  // Jasmine Reporter
  //
  // Draws the images of each failed toImageDiffEqual into Jasmine's HTML
  // report, under the message of the failure. imagediff records the images
  // (see imagediff.recordFailures). This reporter takes them at each spec and
  // suite boundary, and so knows which spec or suite they failed in.

  var
    UNDEFINED = 'undefined',

    report,           // root element of Jasmine's HTML report, once it's found
    observer,
    spec,             // id of the running spec
    suites  = [],     // ids of the running suites, innermost last
    kept    = {},     // recorded failures, by spec or suite id
    failed  = [],     // failed specs and suites the report hasn't listed yet
    listed  = 0,      // failures of the report that are dealt with

    reporter;

  if (!imagediff || !imagediff.takeFailures) {
    throw new Error('imagediff-jasmine needs imagediff 2.1 or later: load imagediff first.');
  }

  // Copies an image into a new canvas.
  function toCanvas (object) {
    var
      data = imagediff.toImageData(object),
      canvas = imagediff.createCanvas(data.width, data.height);

    canvas.getContext('2d').putImageData(data, 0, 0);
    return canvas;
  }

  // Takes what imagediff recorded since the last boundary, for the spec or
  // suite that was running.
  function collect () {
    var
      taken = imagediff.takeFailures(),
      // Failures outside of every suite aren't listed with the others.
      id = spec || suites[suites.length - 1];

    if (!id || !taken.length) return;
    kept[id] = (kept[id] || []).concat(taken);
  }

  // Lines up the failed expectations of a finished spec or suite with the
  // failures recorded while it ran.
  function finish (result) {
    var
      recorded = kept[result.id] || [],
      expectations = result.failedExpectations || [],
      failure = { description: result.description, messages: [], images: [] },
      count = 0,
      i;

    delete kept[result.id];
    if (!report || result.status !== 'failed') return;

    for (i = 0; i < expectations.length; i++) {
      failure.messages.push(expectations[i].message);
      if (expectations[i].matcherName === 'toImageDiffEqual') {
        failure.images[i] = recorded[count++];
      }
    }
    // Better no images than the images of another failure.
    if (count !== recorded.length) failure.images = [];

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

  function imagesElement (recorded) {
    var element = document.createElement('div');
    element.className = 'imagediff-images';
    element.style.padding = '5px 9px 0'; // in line with the message
    element.appendChild(imageElement('Actual', recorded.actual));
    element.appendChild(imageElement('Expected', recorded.expected));
    element.appendChild(imageElement('Diff', imagediff.diff(recorded.actual, recorded.expected)));
    return element;
  }

  function imageElement (label, image) {
    var
      element = document.createElement('div'),
      caption = document.createElement('div');

    element.className = 'imagediff-' + label.toLowerCase();
    element.style.display = 'inline-block';
    element.style.verticalAlign = 'top';
    element.style.marginRight = '10px';
    caption.appendChild(document.createTextNode(label + ':'));
    element.appendChild(caption);
    element.appendChild(toCanvas(image));
    return element;
  }

  reporter = {
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
      imagediff.recordFailures(!!report);
      // Jasmine may call this reporter before its own, and may list the
      // failures only at the end, so draw whenever the report changes.
      if (report) {
        observer = new MutationObserver(draw);
        observer.observe(report, { childList: true, subtree: true });
      }
    },
    suiteStarted : function (result) {
      collect();
      suites.push(result.id);
    },
    specStarted : function (result) {
      collect();
      spec = result.id;
    },
    specDone : function (result) {
      collect();
      spec = null;
      finish(result);
    },
    suiteDone : function (result) {
      collect();
      suites.pop();
      finish(result);
    },
    jasmineDone : function () {
      imagediff.recordFailures(false);
    }
  };

  return { reporter: reporter };
});
