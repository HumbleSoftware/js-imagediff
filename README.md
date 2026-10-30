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
* `diff(a, b, options)` performs an image diff on a and b, returning a - b.
  * `options.align` set to `'top'` to top-align the images when diffing different sizes.
* `noConflict()` removes imagediff from the global space for compatibility, returning imagediff.
* `imageDataToPNG(imageData, outputFile, [callback])` (node only) renders the imageData to png in outputFile with optional callback.

NodeJS
------

js-imagediff is available through npm and needs Node.js 18.12 or later on the 18 line, or 20.9 or later (`^18.12.0 || >=20.9.0`, as node-canvas 3 does). In Node.js it draws with [node-canvas](https://github.com/Automattic/node-canvas) 3, an optional dependency that installs from prebuilt binaries on common platforms; elsewhere it builds from source, which needs Cairo and the other libraries listed in the node-canvas [installation guide](https://github.com/Automattic/node-canvas#installation).

Install the library with `npm install imagediff` and load it with `require('imagediff')`, or install the command line tool with `npm install -g imagediff`.

### Command Line

* `imagediff [-e|--equal] [-t|--tolerance VALUE] FILE_A FILE_B` tests equality of two image files with an optional tolerance, printing `true` or `false` and exiting with status 0 or 1.
* `imagediff [-d|--diff] FILE_A FILE_B OUTPUT_FILE` renders an imagediff between two files, saving it as a PNG in the output file.

### Cannot find module 'canvas'

Canvas is an optional dependency for better browser and bundler support, so the library loads without it and reports this error when it first needs a canvas. If you see it in Node.js, check the output of `npm install`, in case node-canvas failed to install. This relates to https://github.com/HumbleSoftware/js-imagediff/issues/22.

Unit Testing Canvas
-------------------

JS ImageDiff opens up the easy testing of Canvas and other image-like objects in JavaScript.  js-imagediff supplies two Jasmine matchers to make this easier.

* `toImageDiffEqual(expected, tolerance)` expect a result to equal another image type.
* `toBeImageData()` expect a result to be ImageData.

The matchers work with Jasmine 2.0 and later. To see how two images differ, render `imagediff.diff(actual, expected)` to a canvas, or save it with `imagediff.imageDataToPNG()` in Node.js.

To use matchers:

```javascript
  beforeEach(function () {
    jasmine.addMatchers(imagediff.jasmine);
  });

  it('draws the expected image', function () {
    expect(canvas).toImageDiffEqual(expectedImage, 2);
  });
```

Demo
----

A demo is available at https://humblesoftware.github.io/js-imagediff/, and the same example is in [`examples/`](examples/) in this repository.

Users
-----

* [Flotr2](https://humblesoftware.com/flotr2/) - unit testing
* [Envision.js](https://github.com/HumbleSoftware/envisionjs) - unit testing
* [CSS Critic](https://github.com/cburgmer/csscritic) - A CSS regression testing framework
* [HSLuv (formerly HUSL)](https://www.hsluv.org/) - used for regression testing before release.
* [SUCCSS](https://github.com/B2F/Succss) - CSS regression testing.
* [Origami.js](https://github.com/raphamorim/origami.js) - A canvas library

If you are using js-imagediff please drop us a line and let us know what you are doing with it.

Development
-----------

Commit messages and PR titles follow Conventional Commits; see [CONTRIBUTING.md](CONTRIBUTING.md).

### Local setup

Use the Node version in `.nvmrc`, then:

```sh
npm ci
npx playwright install --with-deps chromium  # one-time
npm test
```

### Scripts

* `npm test` runs the specs in Node.js and then in headless Chromium, and fails if either fails. The specs and the CLI use the source in `js/`, so no build is needed first.
* `npm run test:node` runs the specs, including a smoke test of the `imagediff` CLI, in Node.js against [node-canvas](https://github.com/Automattic/node-canvas) (the optional `canvas` dependency, which `npm ci` installs from prebuilt binaries on common platforms).
* `npm run test:browser` runs the specs in headless Chromium with Playwright.
* `npm run test:serve` serves the specs at http://localhost:8085/spec/ to watch them run in a browser.
* `IMAGEDIFF_LIBRARY=imagediff.min.js npm test` runs the same specs against a built file (a path from the repository root) instead of the source: through `require` in Node and as a `<script>` global in Chromium. `npm run test:built` does this for `imagediff.js` and then `imagediff.min.js`.
* `npm run release` builds the release files and then runs `npm run test:built`, leaving them ready to commit. `npm publish` runs `npm run test:built` first (without rebuilding) and refuses to publish if it fails or if the built files differ from what's committed. See [CONTRIBUTING.md](CONTRIBUTING.md#releasing).
* `npm run build` (or `make imagediff`) writes `imagediff.js` (a license header naming the `package.json` version + `js/imagediff.js`) and `imagediff.min.js`, minified with [terser](https://terser.org/) to ES5 output. Run it only when preparing a release; see [CONTRIBUTING.md](CONTRIBUTING.md#build-outputs).

### Dev container

The repo includes an optional [dev container](https://containers.dev/) with Node, Chromium and its system libraries ready to go, so only Podman or Docker is needed. Open the repo in VS Code or Codespaces, or run `devcontainer up --workspace-folder .`, and dependencies are installed with `npm ci`; then `npm test` works as above. Working without the container is still supported.

The container uses the official Playwright image, whose tag in `.devcontainer/devcontainer.json` must match the `@playwright/test` version in `package-lock.json`. Bump the tag whenever Playwright is upgraded. CI (`.github/workflows/test.yml`) reads the image from the same file, so it needs no separate change.

Changelog
---------

### 2.0.0

Breaking changes:

* Node.js `^18.12.0 || >=20.9.0` is required, and the optional `canvas` dependency is node-canvas 3 (was 1.x).
* The Jasmine matchers use the Jasmine 2.0+ API: add them with `jasmine.addMatchers(imagediff.jasmine)`. Jasmine 1 (`this.addMatchers`) is no longer supported.
* `toImageDiffEqual` failure messages are plain text in browsers, as in Node.js, instead of HTML with the actual, expected and diff images.
* The Bower package (`bower.json`) is removed; install from npm.
* The npm package contains only the library, the CLI and their license and docs.

Other changes:

* The library loads without a canvas implementation (in bundlers, or in Node.js without `canvas`) and reports the missing module when first used.
* The library loads in bundlers that wrap modules in strict mode, and AMD `define` receives the module.
* The matchers are tested on Jasmine 7.
* The built files' header names the package version.
* The repository's default branch is `main` (was `master`).

### 1.0.8

* Update canvas dependency.
* Expose internal Canvas.

### 1.0.7

* Add async image loading for canvas (closes #31, #35, #39).
* Support `--diff`, `--equal`, `--tolerance` (closes #17).

### 1.0.6

* Add top-aligned diffing option.
* Fix issue with diffing transparencies.

### 1.0.5

* Move canvas to optional dependencies for browserify support.

### 1.0.4

* Updated canvas dependency.
* Add check for arguments count in diff mode.

### 1.0.3

* Added NPM/node.js support.
* Added command line interface for `equal` and `diff` methods.
* Added `imageDataToPNG` method for node environments.
* Added tolerance to handle lossy formats and provide option for acceptable difference.

### 1.0.2

* Added optional width / height parameters to `createCanvas` for symmetry with `createImageData`.
* Fixed issue with `toImageDiffEqual()` matcher and non Node types - will no convert ImageData and contexts to Canvas elements for display.

### 1.0.1

* Moved library to imagediff.js
* Added Jasmine matchers
* Minor bug fixes, lint fixes.

Author
------
Carl Sutherland carl@humblesoftware.com
http://www.humblesoftware.com
