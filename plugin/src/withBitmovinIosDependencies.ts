import {
  ConfigPlugin,
  IOSConfig,
  withXcodeProject,
} from 'expo/config-plugins';

/**
 * React Native's `spm_dependency` helper adds Swift package products to the
 * native module's target in the Pods project. With static CocoaPods linkage,
 * dynamic Swift package products are not automatically linked and embedded by
 * the application target. This can produce a successful build that fails at
 * launch because a transitive framework cannot be loaded.
 *
 * React Native documents linking the dynamic product to the application target
 * as the workaround:
 * https://github.com/facebook/react-native/pull/44627#user-content-limitations
 *
 * This Expo config plugin applies that workaround during prebuild. It adds the
 * Player and platform-specific IMA package products to the generated app target
 * and its Frameworks build phase, while keeping repeated prebuilds idempotent.
 * Using `withXcodeProject` is Expo's supported mechanism for modifying the
 * generated Xcode project:
 * https://docs.expo.dev/config-plugins/development-and-debugging/#best-practices-for-mods
 */

type ApplePlatform = 'ios' | 'tvos';

interface SwiftPackageDependency {
  url: string;
  version: string;
  product: string;
}

interface AppleDependencies {
  player: SwiftPackageDependency;
  ima: Record<ApplePlatform, SwiftPackageDependency>;
}

interface PbxReference {
  value: string;
  comment: string;
}

type PbxObject = Record<string, unknown>;
type PbxSection = Record<string, PbxObject | string>;
type XcodeProject = Parameters<
  typeof IOSConfig.Target.findFirstNativeTarget
>[0];

const appleDependencies: AppleDependencies = {
  player: {
    url: 'https://github.com/bitmovin/player-ios.git',
    version: '3.119.0',
    product: 'BitmovinPlayer',
  },
  ima: {
    ios: {
      url: 'https://github.com/googleads/swift-package-manager-google-interactive-media-ads-ios',
      version: '3.31.0',
      product: 'GoogleInteractiveMediaAds',
    },
    tvos: {
      url: 'https://github.com/googleads/swift-package-manager-google-interactive-media-ads-tvos',
      version: '4.16.0',
      product: 'GoogleInteractiveMediaAdsTvOS',
    },
  },
};

const isPbxObject = (value: unknown): value is PbxObject =>
  typeof value === 'object' && value != null;

const getSection = (project: XcodeProject, name: string): PbxSection => {
  const objects = project.hash.project.objects as Record<string, PbxSection>;
  return (objects[name] ??= {});
};

const getObjectEntries = (section: PbxSection): [string, PbxObject][] =>
  Object.entries(section).flatMap(([key, value]) =>
    !key.endsWith('_comment') && isPbxObject(value) ? [[key, value]] : []
  );

const unquote = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/^"|"$/g, '') : '';

const normalizePackageUrl = (url: string): string =>
  unquote(url).replace(/\/$/, '').replace(/\.git$/, '');

const getPackageName = (url: string): string => {
  const path = new URL(url).pathname.replace(/\/$/, '');
  return path.substring(path.lastIndexOf('/') + 1).replace(/\.git$/, '');
};

const addReference = (references: PbxReference[], reference: PbxReference) => {
  if (!references.some(({ value }) => value === reference.value)) {
    references.push(reference);
  }
};

const removeReferences = (references: PbxReference[], values: Set<string>) => {
  for (let index = references.length - 1; index >= 0; index--) {
    if (values.has(references[index].value)) {
      references.splice(index, 1);
    }
  }
};

const removeSectionObject = (section: PbxSection, uuid: string) => {
  delete section[uuid];
  delete section[`${uuid}_comment`];
};

const addPackageReference = (
  project: XcodeProject,
  dependency: SwiftPackageDependency
): PbxReference => {
  const section = getSection(project, 'XCRemoteSwiftPackageReference');
  const normalizedUrl = normalizePackageUrl(dependency.url);
  const existing = getObjectEntries(section).find(
    ([, value]) =>
      normalizePackageUrl(unquote(value.repositoryURL)) === normalizedUrl
  );
  const packageName = getPackageName(dependency.url);

  if (existing) {
    const [uuid, value] = existing;
    const requirement = value.requirement;
    if (
      !isPbxObject(requirement) ||
      requirement.kind !== 'exactVersion' ||
      requirement.version !== dependency.version
    ) {
      throw new Error(
        `Bitmovin requires ${packageName} at exact version ${dependency.version}, but the Xcode project already uses a different requirement.`
      );
    }
    return {
      value: uuid,
      comment:
        (section[`${uuid}_comment`] as string | undefined) ??
        `XCRemoteSwiftPackageReference "${packageName}"`,
    };
  }

  const uuid = project.generateUuid();
  const comment = `XCRemoteSwiftPackageReference "${packageName}"`;
  section[uuid] = {
    isa: 'XCRemoteSwiftPackageReference',
    repositoryURL: `"${dependency.url}"`,
    requirement: {
      kind: 'exactVersion',
      version: dependency.version,
    },
  };
  section[`${uuid}_comment`] = comment;
  return { value: uuid, comment };
};

const addProductDependency = (
  project: XcodeProject,
  packageReference: PbxReference,
  productName: string
): PbxReference => {
  const section = getSection(project, 'XCSwiftPackageProductDependency');
  const existing = getObjectEntries(section).find(
    ([, value]) =>
      value.package === packageReference.value &&
      value.productName === productName
  );

  if (existing) {
    return { value: existing[0], comment: productName };
  }

  const uuid = project.generateUuid();
  section[uuid] = {
    isa: 'XCSwiftPackageProductDependency',
    package: packageReference.value,
    package_comment: packageReference.comment,
    productName,
  };
  section[`${uuid}_comment`] = productName;
  return { value: uuid, comment: productName };
};

const addProductToFrameworks = (
  project: XcodeProject,
  targetUuid: string,
  productReference: PbxReference
) => {
  const section = getSection(project, 'PBXBuildFile');
  const existing = getObjectEntries(section).find(
    ([, value]) => value.productRef === productReference.value
  );
  const buildFileReference = existing
    ? {
        value: existing[0],
        comment: `${productReference.comment} in Frameworks`,
      }
    : {
        value: project.generateUuid(),
        comment: `${productReference.comment} in Frameworks`,
      };

  if (!existing) {
    section[buildFileReference.value] = {
      isa: 'PBXBuildFile',
      productRef: productReference.value,
      productRef_comment: productReference.comment,
    };
    section[`${buildFileReference.value}_comment`] =
      buildFileReference.comment;
  }

  const frameworksBuildPhase = project.pbxFrameworksBuildPhaseObj(targetUuid);
  if (!frameworksBuildPhase) {
    throw new Error('Could not find the app target Frameworks build phase.');
  }
  const files = (frameworksBuildPhase.files ??= []) as PbxReference[];
  addReference(files, buildFileReference);
};

const removePackageDependency = (
  project: XcodeProject,
  targetUuid: string,
  packageReferences: PbxReference[],
  productDependencies: PbxReference[],
  dependency: SwiftPackageDependency
) => {
  const packageSection = getSection(
    project,
    'XCRemoteSwiftPackageReference'
  );
  const packageUuids = new Set(
    getObjectEntries(packageSection)
      .filter(
        ([, value]) =>
          normalizePackageUrl(unquote(value.repositoryURL)) ===
          normalizePackageUrl(dependency.url)
      )
      .map(([uuid]) => uuid)
  );
  if (packageUuids.size === 0) {
    return;
  }

  const productSection = getSection(
    project,
    'XCSwiftPackageProductDependency'
  );
  const productUuids = new Set(
    getObjectEntries(productSection)
      .filter(
        ([, value]) =>
          packageUuids.has(unquote(value.package)) &&
          value.productName === dependency.product
      )
      .map(([uuid]) => uuid)
  );
  removeReferences(productDependencies, productUuids);

  const frameworksBuildPhase = project.pbxFrameworksBuildPhaseObj(targetUuid);
  if (!frameworksBuildPhase) {
    throw new Error('Could not find the app target Frameworks build phase.');
  }
  const frameworkFiles = (frameworksBuildPhase.files ??= []) as PbxReference[];
  const buildFileSection = getSection(project, 'PBXBuildFile');
  const buildFileUuids = new Set(
    getObjectEntries(buildFileSection)
      .filter(([, value]) => productUuids.has(unquote(value.productRef)))
      .map(([uuid]) => uuid)
  );
  removeReferences(frameworkFiles, buildFileUuids);

  const frameworksSection = getSection(project, 'PBXFrameworksBuildPhase');
  for (const buildFileUuid of buildFileUuids) {
    const isStillUsed = getObjectEntries(frameworksSection).some(
      ([, value]) =>
        Array.isArray(value.files) &&
        (value.files as PbxReference[]).some(
          ({ value }) => value === buildFileUuid
        )
    );
    if (!isStillUsed) {
      removeSectionObject(buildFileSection, buildFileUuid);
    }
  }

  const nativeTargetSection = getSection(project, 'PBXNativeTarget');
  for (const productUuid of productUuids) {
    const isStillUsed = getObjectEntries(nativeTargetSection).some(
      ([, value]) =>
        Array.isArray(value.packageProductDependencies) &&
        (value.packageProductDependencies as PbxReference[]).some(
          ({ value }) => value === productUuid
        )
    );
    if (!isStillUsed) {
      removeSectionObject(productSection, productUuid);
    }
  }

  for (const packageUuid of packageUuids) {
    const isStillUsed = getObjectEntries(productSection).some(
      ([, value]) => unquote(value.package) === packageUuid
    );
    if (!isStillUsed) {
      removeReferences(packageReferences, new Set([packageUuid]));
      removeSectionObject(packageSection, packageUuid);
    }
  }
};

export const addBitmovinIosDependenciesToAppTarget = (
  project: XcodeProject,
  platform: ApplePlatform
) => {
  const [targetUuid, target] =
    IOSConfig.Target.findFirstNativeTarget(project);
  const projectObject = project.getFirstProject().firstProject as PbxObject;
  const packageReferences = (projectObject.packageReferences ??=
    []) as PbxReference[];
  const productDependencies = (target.packageProductDependencies ??=
    []) as PbxReference[];

  removePackageDependency(
    project,
    targetUuid,
    packageReferences,
    productDependencies,
    appleDependencies.ima[platform === 'ios' ? 'tvos' : 'ios']
  );

  for (const dependency of [
    appleDependencies.player,
    appleDependencies.ima[platform],
  ]) {
    const packageReference = addPackageReference(project, dependency);
    addReference(packageReferences, packageReference);

    const productReference = addProductDependency(
      project,
      packageReference,
      dependency.product
    );
    addReference(productDependencies, productReference);
    addProductToFrameworks(project, targetUuid, productReference);
  }
};

const withBitmovinIosDependencies: ConfigPlugin<ApplePlatform> = (
  config,
  platform
) =>
  withXcodeProject(config, (config) => {
    addBitmovinIosDependenciesToAppTarget(config.modResults, platform);
    return config;
  });

export default withBitmovinIosDependencies;
