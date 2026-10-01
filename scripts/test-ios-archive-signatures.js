const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// Exercise the actual shell phase shipped in the podspec.
const podspec = fs.readFileSync(
  path.join(__dirname, '../ios/RNBitmovinPlayer.podspec'),
  'utf8'
);
const script = podspec.match(/:script => <<-'SH'\n([\s\S]*?)\nSH/)[1];

for (const action of ['install', 'build']) {
  test(`signature cleanup during ${action}`, (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spm signatures '));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const pod = path.join(root, 'RNBitmovinPlayer');
    const other = path.join(root, 'OtherPod');
    fs.mkdirSync(pod);
    fs.mkdirSync(other);
    const duplicate = 'BitmovinPlayerAnalytics.xcframework-ios.signature';
    const tv = 'GoogleInteractiveMediaAds.xcframework-tvos.signature';
    const unique = 'Unique.xcframework-ios.signature';
    const mismatch = 'Different.xcframework-ios.signature';
    for (const name of [duplicate, tv, mismatch]) {
      fs.writeFileSync(path.join(root, name), 'shared');
      fs.writeFileSync(
        path.join(pod, name),
        name === mismatch ? 'different' : 'shared'
      );
    }
    fs.writeFileSync(path.join(pod, unique), 'unique');
    fs.writeFileSync(path.join(other, duplicate), 'shared');
    const run = (directory) =>
      execFileSync('/bin/sh', ['-c', script], {
        env: {
          ...process.env,
          ACTION: action,
          CONFIGURATION_BUILD_DIR: directory,
          PODS_CONFIGURATION_BUILD_DIR: root,
        },
      });
    run(pod);
    run(pod); // Repeated archives and no remaining duplicate matches are safe.
    for (const name of [duplicate, tv]) {
      assert.equal(fs.existsSync(path.join(pod, name)), action !== 'install');
      assert.equal(fs.readFileSync(path.join(root, name), 'utf8'), 'shared');
    }
    assert.equal(fs.readFileSync(path.join(pod, unique), 'utf8'), 'unique');
    assert.equal(
      fs.readFileSync(path.join(pod, mismatch), 'utf8'),
      'different'
    );
    assert.equal(
      fs.readFileSync(path.join(other, duplicate), 'utf8'),
      'shared'
    );
    run(root + '/.'); // Newer RN can flatten the pod into the shared products directory.
    assert.equal(fs.readFileSync(path.join(root, duplicate), 'utf8'), 'shared');
  });
}
