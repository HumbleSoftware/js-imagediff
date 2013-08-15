var imagediff = require('../js/imagediff.js'),
    fs = require('fs');

var source = fs.readFileSync('1_normal_a.jpg');
var target = fs.readFileSync('1_normal_b.jpg');

source = "data:image/jpg;base64," + source.toString('base64');
target = "data:image/jpg;base64," + target.toString('base64');

var isEqual = imagediff.equal(source, target, 0);

console.log("Images are equal: " + isEqual);
