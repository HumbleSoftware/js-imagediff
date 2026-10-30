// Smoke-tests the release files before publishing (npm run test:release).
//
// Copies the files npm would publish into .release/, builds imagediff.js and
// imagediff.min.js there, and runs the specs against each build the way users
// load it: through `require` in Node, as a <script> global in Chromium, and
// through the imagediff CLI. With --committed (on a release PR), it also
// checks that the committed build outputs match the fresh build.

var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var stage = path.join(root, '.release');
var builds = ['imagediff.js', 'imagediff.min.js'];
var checkCommitted = process.argv.slice(2).indexOf('--committed') !== -1;
var failures = [];

function run (label, command, args, options) {
  console.log('\n=== ' + label + '\n');
  var result = childProcess.spawnSync(command, args, Object.assign({
    cwd: root,
    stdio: 'inherit'
  }, options));
  if (result.status !== 0) { failures.push(label); }
  return result.status === 0;
}

function withEnv (env) {
  return { env: Object.assign({}, process.env, env) };
}

// The published file list, without the committed build outputs, so the
// checks below can only pass against a fresh build.
var pack = JSON.parse(childProcess.execFileSync(
  'npm', ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { cwd: root, encoding: 'utf8' }
))[0];

fs.rmSync(stage, { recursive: true, force: true });
pack.files.forEach(function (file) {
  if (builds.indexOf(file.path) !== -1) { return; }
  var target = path.join(stage, file.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file.path), target);
  fs.chmodSync(target, file.mode);
});

if (!run('Build in .release/', process.execPath, [path.join(stage, 'make', 'build.js')])) {
  console.error('\nThe build failed; nothing to check.');
  process.exit(1);
}

builds.forEach(function (build) {
  // The unminified build is the package's `main`, so require the package.
  var library = build === 'imagediff.js' ? stage : path.join(stage, build);
  run('Node specs and CLI: ' + build, 'npm', ['run', 'test:node'], withEnv({
    IMAGEDIFF_LIBRARY: library,
    IMAGEDIFF_BIN: path.join(stage, 'bin', 'imagediff')
  }));
  run('Browser specs: ' + build, 'npm', ['run', 'test:browser'], withEnv({
    IMAGEDIFF_SCRIPT: '.release/' + build
  }));
});

if (checkCommitted) {
  console.log('\n=== Committed build outputs\n');
  builds.forEach(function (build) {
    var committed = fs.readFileSync(path.join(root, build));
    if (committed.equals(fs.readFileSync(path.join(stage, build)))) {
      console.log(build + ' matches the fresh build.');
    } else {
      console.log(build + ' does not match the fresh build; run `npm run build` and commit it.');
      failures.push('Committed ' + build);
    }
  });
}

console.log('');
if (failures.length) {
  console.error('Release check failed:\n  ' + failures.join('\n  '));
  process.exitCode = 1;
} else {
  console.log('Release check passed.');
}
