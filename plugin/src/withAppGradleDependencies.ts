import {
  ConfigPlugin,
  withAppBuildGradle,
  WarningAggregator,
} from 'expo/config-plugins';

export type PluginProps = {
  spacing?: string;
  dependencies?: string[];
};

const defaultProps: PluginProps = {
  spacing: '    ',
  dependencies: [],
};

const CORE_LIBRARY_DESUGARING_DEPENDENCY =
  "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.5'";

const hasCoreLibraryDesugaringEnabled = (contents: string) =>
  contents.includes('coreLibraryDesugaringEnabled') ||
  contents.includes('setCoreLibraryDesugaringEnabled');

const hasCoreLibraryDesugaringDependency = (contents: string) =>
  /\bcoreLibraryDesugaring\b/.test(contents);

const withAppGradleDependencies: ConfigPlugin<PluginProps> = (
  config,
  props: PluginProps
) => {
  const combinedProps = { ...defaultProps, ...(props || {}) };
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      WarningAggregator.addWarningAndroid(
        'withAppGradleDependencies',
        `Cannot automatically configure app/build.gradle if it's not groovy`
      );
      return config;
    }

    const deduplicatedDependencies = Array.from(
      new Set(combinedProps.dependencies)
    );
    const filteredDependencies = deduplicatedDependencies.filter((dep) => {
      return config.modResults.contents.indexOf(dep) === -1;
    });

    const androidBlockStart =
      config.modResults.contents.search(/^android \{$/m);
    if (androidBlockStart === -1) {
      WarningAggregator.addWarningAndroid(
        'withAppGradleDependencies',
        `Cannot configure app/build.gradle as no android block start was found`
      );
      return config;
    }
    const fromAndroid = config.modResults.contents.substring(androidBlockStart);
    const androidBlockEnd = fromAndroid.search(/^\}$/m);
    if (androidBlockEnd === -1) {
      WarningAggregator.addWarningAndroid(
        'withAppGradleDependencies',
        `Cannot configure app/build.gradle as no android block end was found`
      );
      return config;
    }
    const androidPosition = androidBlockStart + androidBlockEnd;
    if (!hasCoreLibraryDesugaringEnabled(config.modResults.contents)) {
      const compileOptionsStart =
        config.modResults.contents.search(/^\s*compileOptions\s*\{$/m);
      if (compileOptionsStart === -1) {
        const compileOptions = [];
        compileOptions.push(`${combinedProps.spacing}compileOptions {`);
        compileOptions.push('\n');
        compileOptions.push(
          `${combinedProps.spacing}${combinedProps.spacing}setCoreLibraryDesugaringEnabled(true)`
        );
        compileOptions.push('\n');
        compileOptions.push(`${combinedProps.spacing}}`);
        compileOptions.push('\n');
        config.modResults.contents = [
          config.modResults.contents.slice(0, androidPosition),
          ...compileOptions,
          config.modResults.contents.slice(androidPosition),
        ].join('');
      } else {
        const compileOptionsLineEnd =
          config.modResults.contents.indexOf('\n', compileOptionsStart) + 1;
        config.modResults.contents = [
          config.modResults.contents.slice(0, compileOptionsLineEnd),
          `${combinedProps.spacing}${combinedProps.spacing}setCoreLibraryDesugaringEnabled(true)\n`,
          config.modResults.contents.slice(compileOptionsLineEnd),
        ].join('');
      }
    }

    const dependenciesBlockStart =
      config.modResults.contents.search(/^dependencies \{$/m);
    if (dependenciesBlockStart === -1) {
      WarningAggregator.addWarningAndroid(
        'withAppGradleDependencies',
        `Cannot configure app/build.gradle as no dependency block start was found`
      );
      return config;
    }
    const fromDependencies = config.modResults.contents.substring(
      dependenciesBlockStart
    );
    const dependenciesBlockEnd = fromDependencies.search(/^\}$/m);
    if (dependenciesBlockEnd === -1) {
      WarningAggregator.addWarningAndroid(
        'withAppGradleDependencies',
        `Cannot configure app/build.gradle as no dependency block end was found`
      );
      return config;
    }
    const position = dependenciesBlockStart + dependenciesBlockEnd;
    const insertedDependencies: string[] = [];
    if (!hasCoreLibraryDesugaringDependency(config.modResults.contents)) {
      insertedDependencies.push('\n');
      insertedDependencies.push(
        `${combinedProps.spacing}${CORE_LIBRARY_DESUGARING_DEPENDENCY}`
      );
      insertedDependencies.push('\n');
    }
    filteredDependencies.forEach((dependency) => {
      insertedDependencies.push(
        `${combinedProps.spacing}implementation '${dependency}'\n`
      );
    });
    if (insertedDependencies.length === 0) {
      return config;
    }
    insertedDependencies.push('\n');
    config.modResults.contents = [
      config.modResults.contents.slice(0, position),
      ...insertedDependencies,
      config.modResults.contents.slice(position),
    ].join('');
    return config;
  });
  return config;
};

export default withAppGradleDependencies;
