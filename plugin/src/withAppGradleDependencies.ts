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
const CORE_LIBRARY_DESUGARING_ARTIFACT =
  'com.android.tools:desugar_jdk_libs';

const stripBlockComments = (contents: string) =>
  contents.replace(/\/\*[\s\S]*?\*\//g, '');

const hasCoreLibraryDesugaringEnabled = (contents: string) =>
  /^\s*(?:setCoreLibraryDesugaringEnabled\s*\(\s*true\s*\)|coreLibraryDesugaringEnabled(?:\s*=\s*|\s+)true\b)/m.test(
    stripBlockComments(contents)
  );

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Removes quoted strings and trailing line comments so that braces appearing
// inside them do not throw off the nesting-depth tracking below.
const stripLineNoise = (line: string) =>
  line
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/\/\/.*$/, '');

const hasGradleDependencyDeclaration = (
  contents: string,
  dependency: string,
  configuration?: string,
  allowVersionSuffix = false
) => {
  const dependencyPattern = escapeRegExp(dependency);
  const configurationPattern = configuration
    ? escapeRegExp(configuration)
    : '[A-Za-z_][\\w.-]*';
  const versionSuffixPattern = allowVersionSuffix ? `(?::[^'"]*)?` : '';
  const declarationPattern = new RegExp(
    `^${configurationPattern}\\s*(?:\\(\\s*)?['"]${dependencyPattern}${versionSuffixPattern}['"]`
  );
  let nestedBlockDepth = 0;

  return stripBlockComments(contents)
    .split('\n')
    .some((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('//')) {
        return false;
      }

      if (/^dependencies\s*\{$/.test(trimmedLine)) {
        return false;
      }

      const isTopLevelDependency =
        nestedBlockDepth === 0 && declarationPattern.test(trimmedLine);
      const sanitizedLine = stripLineNoise(trimmedLine);
      const openBlockCount = (sanitizedLine.match(/\{/g) || []).length;
      const closeBlockCount = (sanitizedLine.match(/\}/g) || []).length;
      nestedBlockDepth += openBlockCount - closeBlockCount;

      return isTopLevelDependency;
    });
};

// Matches any pinned version of the desugaring artifact so an existing
// declaration is never duplicated, even when it pins a different version.
const hasCoreLibraryDesugaringDependency = (contents: string) =>
  hasGradleDependencyDeclaration(
    contents,
    CORE_LIBRARY_DESUGARING_ARTIFACT,
    'coreLibraryDesugaring',
    true
  );

const replaceDisabledCoreLibraryDesugaringSettingsInGradle = (
  contents: string
) =>
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

const replaceDisabledCoreLibraryDesugaringSettings = (contents: string) =>
  contents
    .split(/(\/\*[\s\S]*?\*\/)/g)
    .map((part) =>
      part.startsWith('/*')
        ? part
        : replaceDisabledCoreLibraryDesugaringSettingsInGradle(part)
    )
    .join('');

const ensureCoreLibraryDesugaringCompileOptions = (
  contents: string,
  spacing: string,
  androidBlockStart: number,
  androidPosition: number
) => {
  const androidBlock = contents.slice(androidBlockStart, androidPosition);
  const updatedAndroidBlock =
    replaceDisabledCoreLibraryDesugaringSettings(androidBlock);
  const updatedContents = [
    contents.slice(0, androidBlockStart),
    updatedAndroidBlock,
    contents.slice(androidPosition),
  ].join('');
  const updatedAndroidPosition =
    androidPosition + updatedAndroidBlock.length - androidBlock.length;

  if (hasCoreLibraryDesugaringEnabled(updatedAndroidBlock)) {
    return updatedContents;
  }

  const compileOptionsRelativeStart = updatedAndroidBlock.search(
    /^[^\S\r\n]*compileOptions\s*\{$/m
  );
  if (compileOptionsRelativeStart === -1) {
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
      updatedContents.slice(0, updatedAndroidPosition),
      ...compileOptions,
      updatedContents.slice(updatedAndroidPosition),
    ].join('');
  }

  const compileOptionsStart = androidBlockStart + compileOptionsRelativeStart;
  const compileOptionsLineEnd =
    updatedContents.indexOf('\n', compileOptionsStart) + 1;
  return [
    updatedContents.slice(0, compileOptionsLineEnd),
    `${spacing}${spacing}setCoreLibraryDesugaringEnabled(true)\n`,
    updatedContents.slice(compileOptionsLineEnd),
  ].join('');
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
      androidBlockStart,
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
    const dependencyDeclarations: string[] = [];
    if (!hasCoreLibraryDesugaringDependency(dependenciesBlock)) {
      dependencyDeclarations.push(
        `${spacing}${CORE_LIBRARY_DESUGARING_DEPENDENCY}`
      );
    }
    const deduplicatedDependencies = Array.from(
      new Set(combinedProps.dependencies)
    );
    deduplicatedDependencies
      .filter(
        (dependency) =>
          !hasGradleDependencyDeclaration(dependenciesBlock, dependency)
      )
      .forEach((dependency) => {
        dependencyDeclarations.push(`${spacing}implementation '${dependency}'`);
      });
    if (dependencyDeclarations.length === 0) {
      return config;
    }
    config.modResults.contents = [
      config.modResults.contents.slice(0, position),
      `\n${dependencyDeclarations.join('\n')}\n`,
      config.modResults.contents.slice(position),
    ].join('');
    return config;
  });
  return config;
};

export default withAppGradleDependencies;
