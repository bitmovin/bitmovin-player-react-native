const fs = require('fs');
const path = require('path');

// Xcode 26.4 breaks compilation with the fmt 11.0.2 podspecs pinned
// by react-native. This postinstall patch bumps the affected iOS
// podspec graph to fmt 12.1.0 before Expo prebuild / CocoaPods resolution.
// Remove this script once the example app upgrades to a React Native version
// that already depends on fmt 12.1.0 or newer.
// Issue tracker for RN: https://github.com/facebook/react-native/issues/55601

const reactNativeRoot = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native'
);
const fmtPodspecPath = path.join(
  reactNativeRoot,
  'third-party-podspecs',
  'fmt.podspec'
);

const files = [
  'third-party-podspecs/fmt.podspec',
  'third-party-podspecs/RCT-Folly.podspec',
  'ReactCommon/jsi/React-jsi.podspec',
  'ReactCommon/React-Fabric.podspec',
  'ReactCommon/React-FabricImage.podspec',
  'ReactCommon/jsitooling/React-jsitooling.podspec',
  'ReactCommon/cxxreact/React-cxxreact.podspec',
  'ReactCommon/jsiexecutor/React-jsiexecutor.podspec',
  'ReactCommon/ReactCommon.podspec',
  'ReactCommon/React-FabricComponents.podspec',
  'ReactCommon/hermes/React-hermes.podspec',
  'Libraries/Blob/React-RCTBlob.podspec',
  'ReactCommon/react/renderer/debug/React-rendererdebug.podspec',
  'ReactCommon/react/renderer/graphics/React-graphics.podspec',
  'React/CoreModules/React-CoreModules.podspec',
  'ReactCommon/react/nativemodule/samples/ReactCommon-Samples.podspec',
];

function shouldPatch() {
  if (!fs.existsSync(fmtPodspecPath)) {
    return false;
  }

  const fmtPodspec = fs.readFileSync(fmtPodspecPath, 'utf8');
  return fmtPodspec.includes('"11.0.2"');
}

function patchFile(relativePath) {
  const filePath = path.join(reactNativeRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  const original = fs.readFileSync(filePath, 'utf8');
  let next = original;

  next = next.replace(/"11\.0\.2"/g, '"12.1.0"');

  if (relativePath === 'third-party-podspecs/fmt.podspec') {
    next = next.replace(
      /spec\.version = "12\.1\.0"/,
      'spec.version = "12.1.0"'
    );
    next = next.replace(/:tag => "12\.1\.0"/, ':tag => "12.1.0"');
  }

  if (next !== original) {
    fs.writeFileSync(filePath, next);
    return true;
  }

  return false;
}

if (!fs.existsSync(reactNativeRoot)) {
  process.exit(0);
}

if (!shouldPatch()) {
  console.log('patch-react-native-fmt: skipped, fmt is already >= 12.1.0');
  process.exit(0);
}

let changed = 0;
for (const file of files) {
  if (patchFile(file)) {
    changed += 1;
  }
}

console.log(`patch-react-native-fmt: patched ${changed} file(s)`);
