module.exports = function(config) {
  config.set({
    browsers : ['PhantomJS'],
    frameworks: ['jasmine'],
    files: [
      'js/*.js',
      'spec/*.js'
    ],
    singleRun: true
  });
};
