// Sloppy dev tests
imageDiff = require('./imagediff.js');
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

var img = new Canvas.Image();


tester = img
console.log('Type of canvas: ', Object.prototype.toString.apply(tester));
console.log('isContext: ', imageDiff.isContext(tester));

console.log('isImage: ', imageDiff.isImage(tester));
console.log('isCanvas: ', imageDiff.isCanvas(tester));
console.log('isImageData: ', imageDiff.isImageData(tester));
console.log('isImageType: ', imageDiff.isImageType(tester));

console.log('Are canvas1 and 2 different: ', imageDiff.diff(canvas, canvas2));
