module.exports = function(config) {
  config.set({
    browsers : ['PhantomJS'],
    frameworks: ['jasmine'],
    files: [
      'js/*.js',
      'spec/*.js',
      {pattern: 'spec/images/*', included: false}
    ],
    singleRun: true,
    proxies: {
       '/images/': 'http://localhost:9876/base/spec/images/'
    }
  });
};
