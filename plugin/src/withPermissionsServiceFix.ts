import { withDangerousMod, ConfigPlugin } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

const PATCH_TARGET = 'requestedPermissions.contains(permission)';
const PATCH_REPLACEMENT = 'requestedPermissions?.contains(permission) == true';

function applyPatch(source: string): string {
  // Avoid double-patching
  if (source.includes(PATCH_REPLACEMENT)) {
    return source;
  }
  return source.replace(PATCH_TARGET, PATCH_REPLACEMENT);
}

function patchPermissionsServiceKotlin(projectRoot: string) {
  const kotlinPath = path.join(
    projectRoot,
    'node_modules',
    'expo-modules-core',
    'android',
    'src',
    'main',
    'java',
    'expo',
    'modules',
    'adapters',
    'react',
    'permissions',
    'PermissionsService.kt'
  );

  if (!fs.existsSync(kotlinPath)) {
    console.warn(
      `[withPermissionsServiceFix] PermissionsService.kt not found at: ${kotlinPath}`
    );
    return;
  }

  const original = fs.readFileSync(kotlinPath, 'utf8');
  const patched = applyPatch(original);

  if (original !== patched) {
    fs.writeFileSync(kotlinPath, patched);
    console.log(
      '[withPermissionsServiceFix] Patched PermissionsService.kt for API-35.'
    );
  } else {
    console.log(
      '[withPermissionsServiceFix] PermissionsService.kt already contains the fix.'
    );
  }
}

const withPermissionsServiceFix: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      patchPermissionsServiceKotlin(config.modRequest.projectRoot);
      return config;
    },
  ]);
};

export default withPermissionsServiceFix;
