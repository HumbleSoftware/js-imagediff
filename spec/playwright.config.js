var defineConfig = require('@playwright/test').defineConfig;

var port = Number(process.env.PORT) || 8085;

module.exports = defineConfig({
  testDir: './browser',
  // In CI, also annotate failing specs on the PR's checks.
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:' + port
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:' + port + '/spec/',
    reuseExistingServer: !process.env.CI
  }
});
