"use strict";

module.exports = {
  createCanvas: function Canvas (width, height) {
    var canvas = document.createElement('canvas');
    if (width) canvas.width = width;
    if (height) canvas.height = height;
    return canvas;
  }
};
