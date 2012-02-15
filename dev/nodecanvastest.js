// Sloppy dev tests
// *RUN FROM PROJ ROOT*
var imageDiff = require('../imagediff.js'),
    Canvas = require('canvas'),
    fs = require('fs');

var c = imageDiff.createCanvas(),
    img = new Canvas.Image(),
    ctx = c.getContext('2d'),
    string = '[';
img.src = 'spec/images/checkmark.png';

// drawImage() test
//ctx.drawImage(img, 0, 0);

// getImageData() test
// still results in all 0s
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(0,0);
ctx.lineTo(30,30);
ctx.stroke();

imageData = ctx.getImageData(0, 0, 30, 30);
for (var i = 0; i < imageData.data.length; i++) { string+=imageData.data[i]+',' };
string = string.substr(0,string.length-1) + ']';
fs.writeFile('canvastest.txt', string);
