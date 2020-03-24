// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: [
      'karma-jasmine',
      'karma-phantomjs-launcher'
    ],
    reporters: ['dots'],
    client: {
      jasmine: {
        random: false
      }
    },
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
