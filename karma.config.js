// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: ['karma-jasmine'],
    proxies: {
      '/images/': '/base/spec/images/'
    },
    files: [
      './js/imagediff.js',
      './spec/ImageDiffSpec.js',
      {'pattern': 'spec/images/*.png', 'included': false, 'served': true}
    ]
  })
};
