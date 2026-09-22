const assert = require('node:assert/strict');
const { test } = require('node:test');
const xcode = require('xcode');
const {
  addBitmovinIosDependenciesToAppTarget: apply,
} = require('../plugin/build/withBitmovinIosDependencies');
const dependencies = require('../ios/dependencies.json');

function fixture() {
  const project = xcode.project('test.pbxproj');
  project.hash = {
    project: {
      objects: {
        PBXProject: {
          ROOT: {
            isa: 'PBXProject',
            targets: [{ value: 'APP', comment: 'App' }],
            attributes: {},
          },
        },
        PBXNativeTarget: {
          APP: {
            isa: 'PBXNativeTarget',
            name: 'App',
            productType: '"com.apple.product-type.application"',
            buildPhases: [{ value: 'FRAMEWORKS', comment: 'Frameworks' }],
          },
        },
        PBXFrameworksBuildPhase: {
          FRAMEWORKS: { isa: 'PBXFrameworksBuildPhase', files: [] },
          FRAMEWORKS_comment: 'Frameworks',
        },
      },
      rootObject: 'ROOT',
      archiveVersion: 1,
      objectVersion: 54,
    },
    headComment: '!$*UTF8*$!',
  };
  return project;
}
const objects = (project) => project.hash.project.objects;
const packages = (project) =>
  Object.entries(objects(project).XCRemoteSwiftPackageReference).filter(
    ([id]) => !id.endsWith('_comment')
  );
const player = (project) =>
  packages(project).find(([, pkg]) => pkg.repositoryURL.includes('player-ios'));

test('adds products and survives serialization and repeated prebuilds', () => {
  const project = fixture();
  apply(project, 'ios');
  assert.equal(packages(project).length, 2);
  assert.equal(
    objects(project).PBXFrameworksBuildPhase.FRAMEWORKS.files.length,
    2
  );
  const serialized = project.writeSync();
  project.hash = require('xcode/lib/parser/pbxproj').parse(serialized);
  apply(project, 'ios');
  assert.equal(project.writeSync(), serialized);
});

test('updates an owned version on SDK upgrade', () => {
  const project = fixture();
  apply(project, 'ios');
  const [id, pkg] = player(project);
  pkg.requirement.version = '3.119.0';
  objects(project).PBXProject.ROOT.attributes.BitmovinSwiftPackages[
    id
  ].version = '3.119.0';
  apply(project, 'ios');
  assert.equal(pkg.requirement.version, dependencies.player.version);
});

test('rejects edits to an owned requirement and conflicting customer requirements', () => {
  for (const owned of [true, false]) {
    const project = fixture();
    apply(project, 'ios');
    player(project)[1].requirement.version = '3.100.0';
    if (!owned)
      objects(project).PBXProject.ROOT.attributes.BitmovinSwiftPackages = {};
    assert.throws(() => apply(project, 'ios'), /customer-managed or shared/);
    assert.equal(player(project)[1].requirement.version, '3.100.0');
  }
});

test('switches platforms without leaving IMA products or build files behind', () => {
  const project = fixture();
  apply(project, 'ios');
  for (const platform of ['tvos', 'ios', 'tvos']) {
    apply(project, platform);
    assert.equal(packages(project).length, 2);
    const products = Object.values(
      objects(project).XCSwiftPackageProductDependency
    ).filter((value) => typeof value === 'object');
    assert.deepEqual(
      products.map((value) => value.productName).sort(),
      ['BitmovinPlayer', dependencies.ima[platform].product].sort()
    );
    assert.equal(
      objects(project).PBXFrameworksBuildPhase.FRAMEWORKS.files.length,
      2
    );
    assert.equal(Object.keys(objects(project).PBXBuildFile).length, 4);
  }
});

test('preserves customer-managed packages during platform switching', () => {
  const project = fixture();
  apply(project, 'ios');
  objects(project).PBXProject.ROOT.attributes.BitmovinSwiftPackages = {};
  apply(project, 'tvos');
  assert.equal(packages(project).length, 3);
});

test('requires an explicit target for multiple apps and leaves other targets untouched', () => {
  const project = fixture();
  objects(project).PBXNativeTarget.OTHER = {
    isa: 'PBXNativeTarget',
    name: 'Other',
    productType: '"com.apple.product-type.application"',
    buildPhases: [],
  };
  assert.throws(() => apply(project, 'ios'), /unique application target/);
  apply(project, 'ios', 'App');
  assert.equal(
    objects(project).PBXNativeTarget.OTHER.packageProductDependencies,
    undefined
  );
});

test('does not upgrade a package shared with another target', () => {
  const project = fixture();
  apply(project, 'ios');
  const [id, pkg] = player(project);
  pkg.requirement.version = '3.119.0';
  objects(project).PBXProject.ROOT.attributes.BitmovinSwiftPackages[
    id
  ].version = '3.119.0';
  objects(project).PBXNativeTarget.EXT = {
    isa: 'PBXNativeTarget',
    name: 'Extension',
    productType: '"com.apple.product-type.app-extension"',
    packageProductDependencies: [
      ...objects(project).PBXNativeTarget.APP.packageProductDependencies,
    ],
  };
  assert.throws(() => apply(project, 'ios'), /shared with another target/);
});

test('preserves another target and embed phase when removing an owned IMA package', () => {
  const project = fixture();
  apply(project, 'ios');
  const ima = objects(
    project
  ).PBXNativeTarget.APP.packageProductDependencies.find(
    (ref) => ref.comment === dependencies.ima.ios.product
  );
  const buildFile = objects(
    project
  ).PBXFrameworksBuildPhase.FRAMEWORKS.files.find(
    (ref) => objects(project).PBXBuildFile[ref.value].productRef === ima.value
  );
  objects(project).PBXCopyFilesBuildPhase = {
    EMBED: { isa: 'PBXCopyFilesBuildPhase', files: [buildFile] },
  };
  apply(project, 'tvos');
  assert.ok(objects(project).PBXBuildFile[buildFile.value]);
  assert.ok(objects(project).XCSwiftPackageProductDependency[ima.value]);
  assert.equal(packages(project).length, 3);
});

test('configures platform per invocation and removes Cast from tvOS properties', async () => {
  const withIosConfig =
    require('../plugin/build/withBitmovinIosConfig').default;
  const previous = process.env.EXPO_TV;
  try {
    for (const platform of ['ios', 'tvos', 'ios']) {
      process.env.EXPO_TV = platform === 'tvos' ? '1' : '0';
      const config = withIosConfig(
        { name: 'App', slug: 'app' },
        { features: { googleCastSDK: { ios: '4.8.4' } } }
      );
      const result = await config.mods.ios.podfileProperties({
        ...config,
        modResults: {
          BITMOVIN_GOOGLE_CAST_SDK_VERSION: 'old',
          unrelated: 'keep',
        },
        modRequest: {
          projectRoot: process.cwd(),
          platform: 'ios',
          modName: 'podfileProperties',
          introspect: true,
        },
      });
      assert.equal(result.modResults.BITMOVIN_APPLE_PLATFORM, platform);
      assert.equal(
        result.modResults.BITMOVIN_GOOGLE_CAST_SDK_VERSION,
        platform === 'ios' ? '4.8.4' : undefined
      );
      assert.equal(result.modResults.unrelated, 'keep');
    }
  } finally {
    if (previous === undefined) delete process.env.EXPO_TV;
    else process.env.EXPO_TV = previous;
  }
});
