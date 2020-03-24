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
      '/spec/': '/base/'
    },
    files: [
      './../js/imagediff.js',
      './ImageDiffSpec.js',
      {'pattern': 'images/*.png', 'included': false, 'served': true}
    ]
  })
};
