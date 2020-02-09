// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: ['karma-jasmine'],
    files: [
      './js/imagediff.js',
      './spec/ImageDiffSpec.js'
    ]
  })
};
