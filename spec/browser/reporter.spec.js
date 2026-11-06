// Checks that imagediff.jasmineReporter shows the actual, expected and diff
// images for failed image matchers in Jasmine's HTML report, using the specs in
// spec/reporter/, which fail on purpose.
var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

test('the HTML report shows images for failed image matchers', async function ({ page }) {
  var errors = [];
  page.on('pageerror', function (error) { errors.push(error.message); });

  var library = process.env.IMAGEDIFF_LIBRARY;
  await page.goto('/spec/reporter/' + (library ? '?lib=' + encodeURIComponent(library) : ''));
  await page.waitForFunction(function () {
    return window.specResults && window.specResults.done;
  });
  // The reporter draws after Jasmine's report updates.
  await page.waitForFunction(function () {
    return document.querySelectorAll('.imagediff-failure').length === 4;
  });

  var report = await page.evaluate(function () {
    // The first pixel of a canvas as [r, g, b, a].
    function pixel(canvas) {
      return Array.prototype.slice.call(canvas.getContext('2d').getImageData(0, 0, 1, 1).data);
    }
    function images(message) {
      var next = message.nextElementSibling;
      if (!next || next.className !== 'imagediff-failure') return null;
      return ['actual', 'expected', 'diff'].map(function (name) {
        var canvas = next.querySelector('.imagediff-' + name + ' canvas');
        return { size: canvas.width + 'x' + canvas.height, pixel: pixel(canvas) };
      });
    }
    return Array.prototype.map.call(
      document.querySelectorAll('.jasmine-failures .jasmine-spec-detail'),
      function (detail) {
        return {
          spec: detail.querySelector('.jasmine-description').textContent,
          messages: Array.prototype.map.call(
            detail.querySelectorAll('.jasmine-result-message'),
            function (message) {
              return { text: message.textContent, images: images(message) };
            }
          )
        };
      }
    );
  });

  var red = [255, 0, 0, 255], blue = [0, 0, 255, 255], black = [0, 0, 0, 255];
  var redBlue = [
    { size: '4x4', pixel: red },
    { size: '4x4', pixel: blue },
    { size: '4x4', pixel: [255, 0, 255, 255] }
  ];
  expect(report).toEqual([
    {
      spec: 'imagediff reporter fixture > differs',
      messages: [{ text: 'Expected to be equal.', images: redBlue }]
    },
    {
      spec: 'imagediff reporter fixture > matches when negated',
      messages: [{
        text: 'Expected not to be equal.',
        images: [
          { size: '4x4', pixel: red },
          { size: '4x4', pixel: red },
          { size: '4x4', pixel: black }
        ]
      }]
    },
    {
      spec: 'imagediff reporter fixture > differs with context',
      messages: [{ text: 'with context: Expected to be equal.', images: redBlue }]
    },
    {
      spec: 'imagediff reporter fixture > fails without images',
      messages: [{ text: 'Expected 1 to be 2.', images: null }]
    },
    {
      spec: 'imagediff reporter fixture > mixes failures',
      messages: [
        { text: 'Expected 1 to be 2.', images: null },
        {
          text: 'Expected to be equal.',
          images: [
            { size: '2x2', pixel: red },
            { size: '4x4', pixel: blue },
            // Different sizes are centered, so the corner is blue on black.
            { size: '4x4', pixel: [0, 0, 255, 255] }
          ]
        }
      ]
    }
  ]);

  // Other reporters still get the plain-text messages.
  var messages = await page.evaluate(function () {
    return window.specResults.specs.map(function (spec) {
      return spec.failedExpectations.map(function (failure) { return failure.message; });
    });
  });
  expect(messages).toEqual([
    ['Expected to be equal.'],
    ['Expected not to be equal.'],
    ['with context: Expected to be equal.'],
    ['Expected 1 to be 2.'],
    ['Expected 1 to be 2.', 'Expected to be equal.']
  ]);
  expect(errors).toEqual([]);
});
