js-imagediff
============

JavaScript / Canvas based imagediff utility.

API
---

* `createCanvas()` create a new Canvas element.
* `createImageData(width, height)` create a new ImageData object.
* `isImage(object)` tests for Image object.
* `isCanvas(object)` tests for Canvas object.
* `isContext(object)` tests for CanvasRenderingContext2D object.
* `isImageData(object)` tests for ImageData object.
* `isImageType(object)` tests for any of the above.
* `toImageData(object)` converts image type object to a new ImageData object.
* `equal(a, b, tolerance)` tests image type objects for equality; accepts tolerance in pixels.
* `diff(a, b)` performs an image diff on a and b, returning a - b.
* `noConflict()` removes imagediff from the global space for compatibility, returning imagediff.
* `imageDataToPNG(imageData, outputFile, (callback))` renders the imageData to png in outputFile, firing an optional callback upon save. (Node only)

Command Line
---
* `imagediff [-e|equal] [-t|tolerance VALUE] FILE_A FILE_B` tests equality of two image files with an optional tolerance, printing 'true' or 'false'.
* `imagediff [-d|diff] FILE_A FILE_B OUTPUT_FILE` renders an imagediff between two files, saving as the output file.

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

A demo is available at http://humblesoftware.github.com/js-imagediff/
A Jasmine test demo is available at A demo is available at http://humblesoftware.github.com/js-imagediff/test.html

Changelog
---------
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
