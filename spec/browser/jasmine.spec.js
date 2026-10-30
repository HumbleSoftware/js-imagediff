// Runs the Jasmine specs in spec/index.html and reports each failed spec.
var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

test('jasmine specs pass in the browser', async function ({ page }) {
  var errors = [];
  page.on('pageerror', function (error) { errors.push(error.message); });

  await page.goto('/spec/');
  await page.waitForFunction(function () {
    return window.jsApiReporter && window.jsApiReporter.finished;
  });

  var results = await page.evaluate(function () {
    var reporter = window.jsApiReporter;
    var suites = reporter.suites();
    function failures(result) {
      return {
        name: result.fullName,
        messages: result.failedExpectations.map(function (failure) {
          return failure.message;
        })
      };
    }
    return {
      specs: reporter.specs().length,
      failedSpecs: reporter.specs().filter(function (spec) {
        return spec.status === 'failed';
      }).map(failures),
      failedSuites: Object.keys(suites).map(function (id) {
        return suites[id];
      }).concat([{ fullName: 'Top level', failedExpectations: reporter.runDetails.failedExpectations }])
        .filter(function (suite) {
          return suite.failedExpectations && suite.failedExpectations.length;
        }).map(failures),
      status: reporter.runDetails.overallStatus,
      incompleteReason: reporter.runDetails.incompleteReason
    };
  });

  var report = results.failedSuites.concat(results.failedSpecs).map(function (failure) {
    return '✗ ' + failure.name + '\n    ' + failure.messages.join('\n    ');
  });
  if (results.incompleteReason) { report.push('Incomplete: ' + results.incompleteReason); }
  if (errors.length) { report.push('Page errors:\n    ' + errors.join('\n    ')); }

  console.log(results.specs + ' specs, ' + results.failedSpecs.length + ' failed');
  expect(results.specs, 'no specs ran').toBeGreaterThan(0);
  expect(report.join('\n\n'), 'Jasmine failures').toBe('');
  expect(results.status).toBe('passed');
});
