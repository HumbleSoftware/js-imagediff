// Runs spec/reporter/, whose specs fail on purpose, and checks the images
// imagediff.jasmineReporter adds to Jasmine's HTML report.
// IMAGEDIFF_LIBRARY (a path from the repository root) loads a built file
// instead of the source.
var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

// Pixels as the report's canvases hold them: rrggbbaa.
var
  RED     = 'ff0000ff',
  GREEN   = '00ff00ff',
  BLUE    = '0000ffff',
  YELLOW  = 'ffff00ff',
  MAGENTA = 'ff00ffff',
  CYAN    = '00ffffff',
  BLACK   = '000000ff';

// An image in the report: its size, and how many pixels it has of each color.
function image (width, height, colors) {
  return { width: width, height: height, colors: colors };
}
function solid (color) {
  return image(40, 30, { [color]: 40 * 30 });
}
function images (actual, expected, diff) {
  return { Actual: actual, Expected: expected, Diff: diff };
}

var errors;

test.beforeEach(async function ({ page }) {
  errors = [];
  page.on('pageerror', function (error) { errors.push(error.message); });

  var library = process.env.IMAGEDIFF_LIBRARY;
  await page.goto('/spec/reporter/' + (library ? '?lib=' + encodeURIComponent(library) : ''));
  await page.waitForFunction(function () {
    return window.specResults && window.specResults.done;
  });
});

test.afterEach(function () {
  expect(errors, 'page errors').toEqual([]);
});

test('failed image expectations show their images in the HTML report', async function ({ page }) {
  await expect(page.locator('.jasmine-failures .imagediff')).toHaveCount(7);

  // Each failed spec or suite, with its messages and the images right after
  // each one.
  var report = await page.evaluate(function () {
    function read (canvas) {
      var data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      var colors = {};
      for (var i = 0; i < data.length; i += 4) {
        var color = Array.from(data.slice(i, i + 4), function (value) {
          return value.toString(16).padStart(2, '0');
        }).join('');
        colors[color] = (colors[color] || 0) + 1;
      }
      return { width: canvas.width, height: canvas.height, colors: colors };
    }
    return Array.from(document.querySelectorAll('.jasmine-failures .jasmine-spec-detail'), function (detail) {
      return {
        name: detail.querySelector('.jasmine-description').textContent,
        failures: Array.from(detail.querySelectorAll('.jasmine-result-message'), function (message) {
          var failure = { message: message.textContent };
          var next = message.nextElementSibling;
          if (next.className === 'imagediff') {
            failure.images = {};
            Array.from(next.children).forEach(function (child) {
              failure.images[child.firstChild.textContent] = read(child.querySelector('canvas'));
            });
          }
          return failure;
        })
      };
    });
  });

  expect(report).toEqual([
    {
      name: 'reporter fixture > fails toImageDiffEqual',
      failures: [
        // The actual image is cleared after the expectation; the report has
        // it as it was.
        { message: 'Expected to be equal.', images: images(solid(RED), solid(BLUE), solid(MAGENTA)) }
      ]
    },
    {
      name: 'reporter fixture > fails not.toImageDiffEqual',
      failures: [
        { message: 'Expected not to be equal.', images: images(solid(GREEN), solid(GREEN), solid(BLACK)) }
      ]
    },
    {
      name: 'reporter fixture > fails several expectations',
      failures: [
        { message: 'Expected 1 to be 2.' },
        { message: 'in context: Expected to be equal.', images: images(solid(RED), solid(GREEN), solid(YELLOW)) },
        {
          message: 'Expected to be equal.',
          // Different sizes: the diff centers the smaller image on the larger.
          images: images(
            image(20, 20, { [BLUE]: 20 * 20 }),
            image(60, 40, { [GREEN]: 60 * 40 }),
            image(60, 40, { [GREEN]: 60 * 40 - 20 * 20, [CYAN]: 20 * 20 })
          )
        }
      ]
    },
    {
      name: 'reporter fixture > fails without images',
      failures: [
        { message: "Expected 'a' to be 'b'." },
        { message: 'Is not ImageData' }
      ]
    },
    {
      name: 'reporter fixture > fails after calling the matcher directly',
      failures: [
        { message: 'Expected to be equal.' }
      ]
    },
    {
      name: 'reporter fixture > with failing hooks > fails between them',
      failures: [
        { message: 'Expected to be equal.', images: images(solid(GREEN), solid(RED), solid(YELLOW)) }
      ]
    },
    {
      // beforeAll, then afterAll.
      name: 'reporter fixture > with failing hooks',
      failures: [
        { message: 'Expected to be equal.', images: images(solid(GREEN), solid(BLUE), solid(CYAN)) },
        { message: 'Expected to be equal.', images: images(solid(BLUE), solid(RED), solid(MAGENTA)) }
      ]
    }
  ]);
});

test('other reporters get the same plain-text messages', async function ({ page }) {
  var messages = await page.evaluate(function () {
    return window.specResults.specs.concat(window.specResults.suites).map(function (result) {
      return result.failedExpectations.filter(function (failure) {
        return failure.matcherName === 'toImageDiffEqual';
      }).map(function (failure) {
        return failure.message;
      });
    }).filter(function (messages) {
      return messages.length;
    });
  });

  expect(messages).toEqual([
    ['Expected to be equal.'],
    ['Expected not to be equal.'],
    ['in context: Expected to be equal.', 'Expected to be equal.'],
    ['Expected to be equal.'],
    ['Expected to be equal.'],
    ['Expected to be equal.', 'Expected to be equal.']
  ]);
});
