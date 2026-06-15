import {
  ConfigPlugin,
  withAppBuildGradle,
  WarningAggregator,
} from 'expo/config-plugins';

export type PluginProps = {
  spacing?: string;
  dependencies?: string[];
};

const DEFAULT_SPACING = '    ';

const defaultProps: PluginProps = {
  spacing: DEFAULT_SPACING,
  dependencies: [],
};

const CORE_LIBRARY_DESUGARING_DEPENDENCY =
  "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.1.5'";

const hasCoreLibraryDesugaringEnabled = (contents: string) =>
  contents.includes('coreLibraryDesugaringEnabled') ||
  contents.includes('setCoreLibraryDesugaringEnabled');

const hasCoreLibraryDesugaringDependency = (contents: string) =>
  /\bcoreLibraryDesugaring\b/.test(contents);

const ensureCoreLibraryDesugaringCompileOptions = (
  contents: string,
  spacing: string,
  androidPosition: number
) => {
  if (hasCoreLibraryDesugaringEnabled(contents)) {
    return contents;
  }

  const compileOptionsStart = contents.search(/^\s*compileOptions\s*\{$/m);
  if (compileOptionsStart === -1) {
    const compileOptions = [];
    compileOptions.push(`${spacing}compileOptions {`);
    compileOptions.push('\n');
    compileOptions.push(
      `${spacing}${spacing}setCoreLibraryDesugaringEnabled(true)`
    );
    compileOptions.push('\n');
    compileOptions.push(`${spacing}}`);
    compileOptions.push('\n');
    return [
      contents.slice(0, androidPosition),
      ...compileOptions,
      contents.slice(androidPosition),
    ].join('');
  }

  const compileOptionsLineEnd = contents.indexOf('\n', compileOptionsStart) + 1;
  return [
    contents.slice(0, compileOptionsLineEnd),
    `${spacing}${spacing}setCoreLibraryDesugaringEnabled(true)\n`,
    contents.slice(compileOptionsLineEnd),
  ].join('');
};

const getCoreLibraryDesugaringDependencyLines = (
  contents: string,
  spacing: string
) => {
  if (hasCoreLibraryDesugaringDependency(contents)) {
    return [];
  }

  return ['\n', `${spacing}${CORE_LIBRARY_DESUGARING_DEPENDENCY}`, '\n'];
};

const withAppGradleDependencies: ConfigPlugin<PluginProps> = (
  config,
  props: PluginProps
) => {
  const combinedProps = { ...defaultProps, ...(props || {}) };
  const spacing = combinedProps.spacing || DEFAULT_SPACING;
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
    config.modResults.contents = ensureCoreLibraryDesugaringCompileOptions(
      config.modResults.contents,
      spacing,
      androidPosition
    );

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
    const insertedDependencies = getCoreLibraryDesugaringDependencyLines(
      config.modResults.contents,
      spacing
    );
    filteredDependencies.forEach((dependency) => {
      insertedDependencies.push(`${spacing}implementation '${dependency}'\n`);
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
