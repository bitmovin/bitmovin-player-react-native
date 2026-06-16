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
  /^\s*(?:setCoreLibraryDesugaringEnabled\s*\(\s*true\s*\)|coreLibraryDesugaringEnabled(?:\s*=\s*|\s+)true\b)/m.test(
    contents
  );

const hasCoreLibraryDesugaringDependency = (contents: string) =>
  /^\s*coreLibraryDesugaring\b/m.test(contents);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasGradleDependencyDeclaration = (
  contents: string,
  dependency: string
) => {
  const dependencyPattern = escapeRegExp(dependency);
  const declarationPattern = new RegExp(
    `^[A-Za-z_][\\w.-]*\\s*(?:\\(\\s*)?['"]${dependencyPattern}['"]`
  );
  let nestedBlockDepth = 0;

  return contents.split('\n').some((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//')) {
      return false;
    }

    if (/^dependencies\s*\{$/.test(trimmedLine)) {
      return false;
    }

    const isTopLevelDependency =
      nestedBlockDepth === 0 && declarationPattern.test(trimmedLine);
    const openBlockCount = (trimmedLine.match(/\{/g) || []).length;
    const closeBlockCount = (trimmedLine.match(/\}/g) || []).length;
    nestedBlockDepth += openBlockCount - closeBlockCount;

    return isTopLevelDependency;
  });
};

const replaceDisabledCoreLibraryDesugaringSettings = (contents: string) =>
  contents
    .replace(
      /^(\s*)setCoreLibraryDesugaringEnabled\s*\(\s*false\s*\)/gm,
      '$1setCoreLibraryDesugaringEnabled(true)'
    )
    .replace(
      /^(\s*)coreLibraryDesugaringEnabled(\s*=\s*)false\b/gm,
      '$1coreLibraryDesugaringEnabled$2true'
    )
    .replace(
      /^(\s*)coreLibraryDesugaringEnabled(\s+)false\b/gm,
      '$1coreLibraryDesugaringEnabled$2true'
    );

const ensureCoreLibraryDesugaringCompileOptions = (
  contents: string,
  spacing: string,
  androidPosition: number
) => {
  const updatedContents =
    replaceDisabledCoreLibraryDesugaringSettings(contents);
  if (hasCoreLibraryDesugaringEnabled(updatedContents)) {
    return updatedContents;
  }

  const compileOptionsStart = updatedContents.search(
    /^\s*compileOptions\s*\{$/m
  );
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
      updatedContents.slice(0, androidPosition),
      ...compileOptions,
      updatedContents.slice(androidPosition),
    ].join('');
  }

  const compileOptionsLineEnd =
    updatedContents.indexOf('\n', compileOptionsStart) + 1;
  return [
    updatedContents.slice(0, compileOptionsLineEnd),
    `${spacing}${spacing}setCoreLibraryDesugaringEnabled(true)\n`,
    updatedContents.slice(compileOptionsLineEnd),
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
    const androidPosition = androidBlockStart + androidBlockEnd;
    config.modResults.contents = ensureCoreLibraryDesugaringCompileOptions(
      config.modResults.contents,
      spacing,
      androidPosition
    );

    const updatedDependenciesBlockStart =
      config.modResults.contents.search(/^dependencies \{$/m);
    const updatedFromDependencies = config.modResults.contents.substring(
      updatedDependenciesBlockStart
    );
    const updatedDependenciesBlockEnd = updatedFromDependencies.search(/^\}$/m);
    const position =
      updatedDependenciesBlockStart + updatedDependenciesBlockEnd;
    const dependenciesBlock = config.modResults.contents.slice(
      updatedDependenciesBlockStart,
      position
    );
    const insertedDependencies = getCoreLibraryDesugaringDependencyLines(
      dependenciesBlock,
      spacing
    );
    const deduplicatedDependencies = Array.from(
      new Set(combinedProps.dependencies)
    );
    const filteredDependencies = deduplicatedDependencies.filter(
      (dependency) =>
        !hasGradleDependencyDeclaration(dependenciesBlock, dependency)
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
