js-imagediff
============

JavaScript / Canvas based imagediff utility.

API
---

* `createCanvas()` create a new Canvas element.
* `createImageData(width, height)` create a new ImageData object.
* `displayMask(width, height, regions)` create a image representation of regions mask.
* `isImage(object)` tests for Image object.
* `isCanvas(object)` tests for Canvas object.
* `isContext(object)` tests for CanvasRenderingContext2D object.
* `isImageData(object)` tests for ImageData object.
* `isImageType(object)` tests for any of the above.
* `toImageData(object)` converts image type object to a new ImageData object.
* `equal(a, b, tolerance, options)` tests image type objects for equality; accepts tolerance in pixels.
* `diff(a, b, options)` performs an image diff on a and b, returning a - b.
  * `options.align` set to `'top'` to top-align the images when diffing different sizes.
* `noConflict()` removes imagediff from the global space for compatibility, returning imagediff.
* `imageDataToPNG(imageData, outputFile, [callback])` (node only) renders the imageData to png in outputFile with optional callback.

Regions
_______

Sometimes there's only part of the image that you want to test.
`equal` method accepts optional `regions` array that allows you to specify mask for image comparison.
Each region in the array is a five element array in the form `[x0, y0, x1, y1, include]`, where

* `(x0, y0)` is the smallest coordinate corner of the region (inclusive)
* `(x1, y1)` is the largest coordinate corner of the region (non-inclusive)
* `include` is a boolean value that decides whether the rectangle should be checked for equality.

Setting `include` to `true` will add the region to the mask, setting it to `false` will substract it.
Initially the mask is empty, therefore passing a single rectangle, e.g.:

`equal(a, b, 0, {regions: [[20, 20, 240, 120, true]]})`

will yield `true` if the images are equal within the single passed rectangle (`[20, 20, 240, 120]`).


NodeJS
------

js-imagediff is available through the npm.  It uses [node-canvas](https://github.com/LearnBoost/node-canvas) which requires lib cairo to be installed.
Install js-imagediff with `npm install -g imagediff`.

### Command Line

* `imagediff [-e|equal] [-t|tolerance VALUE] FILE_A FILE_B` tests equality of two image files with an optional tolerance, printing 'true' or 'false'.
* `imagediff [-d|diff] FILE_A FILE_B OUTPUT_FILE` renders an imagediff between two files, saving as the output file.

### Cannot find module 'canvas'

Canvas has been moved to an optional dependency for better browser and browserify support.  If you see a message that the module cannot be found, please check `npm install` first, incase there was indeed an issue installing it.  This relates to  https://github.com/HumbleSoftware/js-imagediff/issues/22.  Please let me know if you have any issues on account of this, or know of a better work around.

Unit Testing Canvas
-------------------

JS ImageDiff opens up the easy testing of Canvas and other image-like objects in JavaScript.  js-imagediff supplies two Jasmine matchers to make this easier.

* `toImageDiffEqual(expected, tolerance)` expect a result to equal another image type.
* `toBeImageData()` expect a result to be ImageData.

On failed tests, `toImageDiffEqual()` will display the expected image, the actual image and the imagediff of the two letting you easily spot mistakes.

To use matchers:

```javascript
  beforeEach(function () {
    this.addMatchers(imagediff.jasmine);
  });
```

Demo
----

* A demo is available at http://humblesoftware.github.com/js-imagediff/
* A Jasmine test demo is available at http://humblesoftware.github.com/js-imagediff/test.html

Users
-----

* [Flotr2](http://humblesoftware.com/flotr2/) - unit testing
* [Envision.js](https://github.com/HumbleSoftware/envisionjs) - unit testing
* [CSS Critic](https://github.com/cburgmer/csscritic) - A CSS regrestion testing framework
* [HUSL - Human-friendly HSL](http://boronine.com/husl/) - used for regression testing before release.
* [SUCCSS](https://github.com/B2F/Succss) - CSS regression testing.
* [Origami.js](https://github.com/raphamorim/origami.js) - A canvas library 

If you are using js-imagediff pelase drop us a line and let us know what you are doing with it.

Changelog
---------
<h3>NEXT</h3>
* Accept regions for masking image comparison

<h3>1.0.8</h3>
* Update canvas dependency.
* Expose internal Canvas.

<h3>1.0.7</h3>
* Add async image loading for canvas (closes #31, #35, #39).
* Support `--diff`, `--equal`, `--tolerance` (closes #17).

<h3>1.0.6</h3>
* Add top-aligned diffing option.
* Fix issue with diffing transparencies.

<h3>1.0.5</h3>
* Move canvas to optional dependencies for browserify support.

<h3>1.0.4</h3>
* Updated canvas dependency.
* Add check for arguments count in diff mode.

<h3>1.0.3</h3>
* Added NPM/node.js support.
* Added command line interface for `equal` and `diff` methods.
* Added `imageDataToPNG` method for node environments.
* Added tolerance to handle lossy formats and provide option for acceptable difference.

<h3>1.0.2</h3>
* Added optional width / height parameters to `createCanvas` for symmetry with `createImageData`.
* Fixed issue with `toImageDiffEqual()` matcher and non Node types - will no convert ImageData and contexts to Canvas elements for display.

<h3>1.0.1</h3>
* Moved library to imagediff.js
* Added Jasmine matchers
* Minor bug fixes, lint fixes.

Author
------
Carl Sutherland carl@humblesoftware.com
http://www.humblesoftware.com
