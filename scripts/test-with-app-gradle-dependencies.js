const assert = require('node:assert/strict');

const withAppGradleDependencies =
  require('../plugin/build/withAppGradleDependencies').default;

const coreLibraryDesugaringDependency =
  "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.5'";

const baseGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

const countOccurrences = (contents, needle) =>
  contents.split(needle).length - 1;

const applyPlugin = async (contents, props = {}) => {
  const config = withAppGradleDependencies(
    { name: 'test-app', slug: 'test-app' },
    props
  );
  const appBuildGradleMod = config.mods?.android?.appBuildGradle;
  assert.equal(typeof appBuildGradleMod, 'function');

  const result = await appBuildGradleMod({
    ...config,
    modResults: {
      language: 'groovy',
      contents,
    },
    modRequest: {
      projectRoot: process.cwd(),
      platform: 'android',
      modName: 'appBuildGradle',
      introspect: true,
    },
  });

  return result.modResults.contents;
};

const tests = [];

const test = (name, run) => {
  tests.push({ name, run });
};

test('adds core library desugaring when no feature dependencies are requested', async () => {
  const result = await applyPlugin(baseGradle);

  assert.match(result, /setCoreLibraryDesugaringEnabled\(true\)/);
  assert.ok(result.includes(coreLibraryDesugaringDependency));
});

test('enables desugaring inside an existing compileOptions block', async () => {
  const gradleWithCompileOptions = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

  const result = await applyPlugin(gradleWithCompileOptions, {
    dependencies: ['com.example:feature:1.0'],
  });

  assert.equal(countOccurrences(result, 'compileOptions {'), 1);
  assert.match(
    result,
    /compileOptions \{\n        setCoreLibraryDesugaringEnabled\(true\)\n        sourceCompatibility/
  );
});

test('ignores compileOptions blocks outside android', async () => {
  const gradleWithExternalCompileOptions = `plugins {
    id 'com.android.application'
}

subprojects {
    compileOptions {
        setCoreLibraryDesugaringEnabled(false)
        sourceCompatibility JavaVersion.VERSION_17
    }
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

  const result = await applyPlugin(gradleWithExternalCompileOptions);

  assert.match(
    result,
    /subprojects \{\n    compileOptions \{\n        setCoreLibraryDesugaringEnabled\(false\)\n        sourceCompatibility JavaVersion\.VERSION_17/
  );
  assert.match(
    result,
    /android \{\n    namespace 'com\.example'\n    compileOptions \{\n        setCoreLibraryDesugaringEnabled\(true\)\n    }\n}/
  );
});

test('does not duplicate existing core library desugaring settings', async () => {
  const gradleWithDesugaring = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
    compileOptions {
        setCoreLibraryDesugaringEnabled(true)
        sourceCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
    ${coreLibraryDesugaringDependency}
}
`;

  const result = await applyPlugin(gradleWithDesugaring, {
    dependencies: ['com.example:feature:1.0'],
  });

  assert.equal(
    countOccurrences(result, 'setCoreLibraryDesugaringEnabled(true)'),
    1
  );
  assert.equal(countOccurrences(result, coreLibraryDesugaringDependency), 1);
  assert.match(result, /implementation 'com.example:feature:1\.0'/);
});

test('replaces explicitly disabled core library desugaring property syntax', async () => {
  const gradleWithDisabledDesugaring = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
    compileOptions {
        coreLibraryDesugaringEnabled false
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

  const result = await applyPlugin(gradleWithDisabledDesugaring);

  assert.match(result, /coreLibraryDesugaringEnabled true/);
  assert.doesNotMatch(result, /coreLibraryDesugaringEnabled false/);
  assert.ok(result.includes(coreLibraryDesugaringDependency));
});

test('replaces explicitly disabled core library desugaring setter syntax', async () => {
  const gradleWithDisabledDesugaring = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
    compileOptions {
        setCoreLibraryDesugaringEnabled(false)
    }
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

  const result = await applyPlugin(gradleWithDisabledDesugaring);

  assert.match(result, /setCoreLibraryDesugaringEnabled\(true\)/);
  assert.doesNotMatch(result, /setCoreLibraryDesugaringEnabled\(false\)/);
  assert.ok(result.includes(coreLibraryDesugaringDependency));
});

test('leaves gradle unchanged when dependencies block is missing', async () => {
  const gradleWithoutDependencies = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}
`;

  const result = await applyPlugin(gradleWithoutDependencies);

  assert.equal(result, gradleWithoutDependencies);
});

test('does not treat comments as existing core library desugaring dependency', async () => {
  const gradleWithDependencyComment = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
    // coreLibraryDesugaring is added by the Bitmovin plugin
}
`;

  const result = await applyPlugin(gradleWithDependencyComment);

  assert.ok(result.includes(coreLibraryDesugaringDependency));
});

test('does not treat block comments as existing core library desugaring dependency', async () => {
  const gradleWithDependencyBlockComment = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
    /*
    ${coreLibraryDesugaringDependency}
    */
}
`;

  const result = await applyPlugin(gradleWithDependencyBlockComment);

  assert.equal(countOccurrences(result, coreLibraryDesugaringDependency), 2);
});

test('does not treat comments as existing feature dependencies', async () => {
  const featureDependency = 'com.example:feature:1.0';
  const gradleWithFeatureDependencyComment = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
    // ${featureDependency} is added by the Bitmovin plugin
}
`;

  const result = await applyPlugin(gradleWithFeatureDependencyComment, {
    dependencies: [featureDependency],
  });

  assert.match(result, /implementation 'com\.example:feature:1\.0'/);
});

test('does not treat block comments as existing feature dependencies', async () => {
  const featureDependency = 'com.example:feature:1.0';
  const gradleWithFeatureDependencyBlockComment = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
    /*
    implementation '${featureDependency}'
    */
}
`;

  const result = await applyPlugin(gradleWithFeatureDependencyBlockComment, {
    dependencies: [featureDependency],
  });

  assert.equal(
    countOccurrences(result, `implementation '${featureDependency}'`),
    2
  );
});

test('does not treat dependency constraints as existing feature dependencies', async () => {
  const featureDependency = 'com.example:feature:1.0';
  const gradleWithFeatureDependencyConstraint = `plugins {
    id 'com.android.application'
}

android {
    namespace 'com.example'
}

dependencies {
    implementation 'com.facebook.react:react-android'
    constraints {
        implementation('${featureDependency}') {
            because 'pins the version when another dependency requests it'
        }
    }
}
`;

  const result = await applyPlugin(gradleWithFeatureDependencyConstraint, {
    dependencies: [featureDependency],
  });

  assert.match(result, /implementation 'com\.example:feature:1\.0'/);
});

const run = async () => {
  const failures = [];

  for (const { name, run } of tests) {
    try {
      await run();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures.push({ name, error });
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
