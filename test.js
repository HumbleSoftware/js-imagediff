imageDiff = require('./imagediff.js');
jsDom = require('jsdom');

var Canvas = require('canvas') 
  , canvas = new Canvas(200,100)
  , ctx = canvas.getContext('2d');

  ctx.font = '30px Impact';
  ctx.rotate(.1);
  ctx.fillText("W00t!", 50, 50);

  var canvas2 = new Canvas(200,100)
  , ctx2 = canvas.getContext('2d');

  ctx2.font = '30px Impact';
  ctx2.rotate(.1);
  ctx2.fillText("W00t!", 50, 50);

console.log('Type of canvas: ', Object.prototype.toString.apply(ctx));
console.log('isContext: ', imageDiff.isContext(ctx));

console.log('isImage: ', imageDiff.isImage(canvas));
console.log('isCanvas: ', imageDiff.isCanvas(canvas));
console.log('isImageData: ', imageDiff.isImageData(canvas));
console.log('isImageType: ', imageDiff.isImageType(canvas));

//console.log('Are canvas1 and 2 different: ', imageDiff.diff(canvas, canvas2));
