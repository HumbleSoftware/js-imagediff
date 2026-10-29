var defineConfig = require('@playwright/test').defineConfig;

var port = Number(process.env.PORT) || 8085;

module.exports = defineConfig({
  testDir: './browser',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:' + port
  },
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:' + port + '/spec/',
    reuseExistingServer: !process.env.CI
  }
});
