// Runs the failing specs in spec/reporter/ and checks what
// imagediff.jasmineReporter draws into Jasmine's HTML report.
// IMAGEDIFF_LIBRARY (a path from the repository root) loads a built file
// instead of the source.
var path = require('path');
var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

var
  RED     = [255, 0, 0, 255],
  GREEN   = [0, 255, 0, 255],
  BLUE    = [0, 0, 255, 255],
  YELLOW  = [255, 255, 0, 255],
  MAGENTA = [255, 0, 255, 255],
  WHITE   = [255, 255, 255, 255],
  BLACK   = [0, 0, 0, 255];

// A message of the report, and the images under it: the size and middle
// pixel of each.
function plain (text) {
  return { text: text, images: null };
}
function image (pixel, width, height) {
  return { width: width || 30, height: height || 20, pixel: pixel };
}
function images (text, actual, expected, diff) {
  return {
    text: text,
    images: { 'Actual:': actual, 'Expected:': expected, 'Diff:': diff }
  };
}

// The failures of spec/reporter/FailingSpec.js, as the report lists them.
var FAILURES = [
  {
    description: 'reporter fixture > fails toImageDiffEqual',
    messages: [
      images('Expected to be equal.', image(RED), image(BLUE), image(MAGENTA))
    ]
  },
  {
    description: 'reporter fixture > fails not.toImageDiffEqual',
    messages: [
      images('Expected not to be equal.', image(GREEN), image(GREEN), image(BLACK))
    ]
  },
  {
    description: 'reporter fixture > fails with context',
    messages: [
      images('the chart: Expected to be equal.', image(YELLOW), image(BLUE), image(WHITE))
    ]
  },
  {
    description: 'reporter fixture > fails without an image matcher',
    messages: [
      plain('Expected 1 to be 2.')
    ]
  },
  {
    description: 'reporter fixture > fails several ways',
    messages: [
      plain('Expected true to be false.'),
      images('Expected to be equal.', image(RED, 40, 20), image(BLUE, 20, 40), image(MAGENTA, 40, 40)),
      images('Expected to be equal.', image(GREEN), image(RED), image(YELLOW))
    ]
  },
  {
    description: 'reporter fixture > fails before the canvas changes',
    messages: [
      images('Expected to be equal.', image(WHITE), image(BLUE), image(YELLOW))
    ]
  },
  {
    description: 'reporter fixture > fails with images that do not line up',
    messages: [
      plain('Expected to be equal.')
    ]
  },
  {
    description: 'reporter fixture > with a failing beforeAll > has a spec',
    messages: [
      images('Expected to be equal.', image(BLUE), image(YELLOW), image(WHITE))
    ]
  },
  {
    description: 'reporter fixture > with a failing beforeAll',
    messages: [
      images('Expected to be equal.', image(GREEN), image(RED), image(YELLOW))
    ]
  },
  {
    description: 'reporter fixture > with a failing afterAll > fails in a spec',
    messages: [
      images('Expected to be equal.', image(BLUE), image(RED), image(MAGENTA))
    ]
  },
  {
    description: 'reporter fixture > with a failing afterAll > and a failing suite inside',
    messages: [
      images('Expected to be equal.', image(WHITE), image(GREEN), image(MAGENTA))
    ]
  },
  {
    description: 'reporter fixture > with a failing afterAll',
    messages: [
      images('Expected to be equal.', image(YELLOW), image(RED), image(GREEN)),
      images('Expected to be equal.', image(WHITE), image(BLUE), image(YELLOW))
    ]
  }
];

// Reads the failures back out of the report.
function readFailures () {
  function read (canvas) {
    var pixel = canvas.getContext('2d').getImageData(
      Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1
    ).data;
    return { width: canvas.width, height: canvas.height, pixel: Array.from(pixel) };
  }
  var details = document.querySelectorAll('.jasmine-failures .jasmine-spec-detail');
  return Array.from(details, function (detail) {
    var messages = detail.querySelectorAll('.jasmine-result-message');
    return {
      description: detail.querySelector('.jasmine-description').textContent,
      messages: Array.from(messages, function (message) {
        var next = message.nextElementSibling, drawn = null;
        if (next && next.className === 'imagediff-images') {
          drawn = {};
          Array.from(next.children).forEach(function (child) {
            drawn[child.firstChild.textContent] = read(child.querySelector('canvas'));
          });
        }
        return { text: message.textContent, images: drawn };
      })
    };
  });
}

// Jasmine calls its reporters in the order they were added.
[
  { order: 'before', query: '' },
  { order: 'after', query: 'order=after' }
].forEach(function (added) {

  test('draws failed image matchers, added ' + added.order + ' the HTML reporter', async function ({ page }) {
    var errors = [];
    page.on('pageerror', function (error) { errors.push(error.message); });

    var library = process.env.IMAGEDIFF_LIBRARY;
    var query = [added.query, library ? 'lib=' + encodeURIComponent(library) : '']
      .filter(Boolean).join('&');
    await page.goto('/spec/reporter/' + (query ? '?' + query : ''));
    await page.waitForFunction(function () {
      return window.specResults && window.specResults.done;
    });

    // One set of images for each failure that has them, and none elsewhere,
    // such as on the afterAll failure outside of the suites.
    var count = FAILURES.reduce(function (sum, failure) {
      return sum + failure.messages.filter(function (message) {
        return message.images;
      }).length;
    }, 0);
    await expect(page.locator('.imagediff-images')).toHaveCount(count);
    expect(await page.evaluate(readFailures)).toEqual(FAILURES);

    // Other reporters are told the same plain-text messages as ever.
    var results = await page.evaluate(function () {
      function messages (result) {
        return result.failedExpectations.map(function (failure) {
          return failure.message;
        });
      }
      return {
        failed: window.specResults.failed.map(messages),
        done: messages(window.specResults.done)
      };
    });
    expect(results.failed).toEqual(FAILURES.map(function (failure) {
      return failure.messages.map(function (message) { return message.text; });
    }));
    expect(results.done).toEqual(['Expected to be equal.']);
    expect(errors).toEqual([]);
  });
});

// The fixture can't show all of this on Jasmine 7, so this plays Jasmine's
// part: specs with a failed toImageDiffEqual each, and a report that lists
// one failure early and the others late, and not all as the reporter was told.
test('draws only on the failure that the report lists for it', async function ({ page }) {
  await page.addScriptTag({
    path: path.join(__dirname, '..', '..', process.env.IMAGEDIFF_LIBRARY || 'js/imagediff.js')
  });

  var drawn = await page.evaluate(function () {
    var
      reporter = imagediff.jasmineReporter,
      report = document.createElement('div'),
      failures = document.createElement('div');

    function fail (id, description, noExpectations) {
      var result, failedExpectations = [];
      reporter.specStarted({ id: id });
      if (!noExpectations) {
        result = imagediff.jasmine.toImageDiffEqual({}).compare(
          imagediff.createCanvas(2, 2),
          imagediff.createCanvas(3, 3)
        );
        failedExpectations.push({ matcherName: 'toImageDiffEqual', message: result.message });
      }
      reporter.specDone({
        id: id,
        description: description,
        status: 'failed',
        failedExpectations: failedExpectations
      });
    }

    function list (description, message) {
      var detail = document.createElement('div');
      detail.className = 'jasmine-spec-detail jasmine-failed';
      detail.innerHTML =
        '<div class="jasmine-description"><a></a></div>' +
        '<div class="jasmine-messages">' +
          '<div class="jasmine-result-message"></div>' +
          '<div class="jasmine-stack-trace"></div>' +
        '</div>';
      detail.querySelector('a').textContent = description;
      detail.querySelector('.jasmine-result-message').textContent = message;
      failures.appendChild(detail);
    }

    function canvases () {
      return Array.from(failures.children, function (detail) {
        return detail.querySelectorAll('.imagediff-images canvas').length;
      });
    }

    report.className = 'jasmine_html-reporter';
    failures.className = 'jasmine-failures';
    report.appendChild(failures);
    document.body.appendChild(report);

    reporter.jasmineStarted({});
    reporter.suiteStarted({ id: 'suite1' });

    // Listed before the reporter is told: drawn as soon as it is.
    list('first', 'Expected to be equal.');
    fail('spec1', 'first');
    var early = canvases();

    // Listed after the run: drawn when the report changes.
    fail('spec2', 'second');
    fail('spec3', 'third');
    fail('spec4', 'fourth', true);
    fail('spec5', 'fifth');
    reporter.suiteDone({ id: 'suite1', description: 'suite', status: 'passed', failedExpectations: [] });
    list('another spec', 'Expected to be equal.');
    list('third', 'Another message.');
    list('fourth', 'Spec has no expectations');
    list('fifth', 'Expected to be equal.');

    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({ early: early, late: canvases() });
      }, 0);
    });
  });

  expect(drawn).toEqual({ early: [3], late: [3, 0, 0, 0, 3] });
});
