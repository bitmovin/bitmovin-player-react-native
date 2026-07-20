import {
  type NativeModule,
  requireOptionalNativeModule,
} from 'expo-modules-core';
import type { GoogleDaiSourceConfig } from '../googleDaiSourceConfig';

const moduleName = 'GoogleDaiModule';

declare class GoogleDaiModule extends NativeModule {
  initialize(googleDaiId: string, playerId: string): Promise<void>;
  load(googleDaiId: string, sourceConfig: GoogleDaiSourceConfig): Promise<void>;
  destroy(googleDaiId: string): Promise<void>;
}

const nativeModule = requireOptionalNativeModule<GoogleDaiModule>(moduleName);

export function assertGoogleDaiModuleAvailable(): GoogleDaiModule {
  if (!nativeModule) {
    throw new Error(
      `Cannot find native module '${moduleName}'. Install @bitmovin/player-react-native-google-dai and rebuild the native application before calling withGoogleDai().`
    );
  }
  return nativeModule;
}

const GoogleDaiModuleProxy: GoogleDaiModule = {
  initialize: (googleDaiId: string, playerId: string) =>
    assertGoogleDaiModuleAvailable().initialize(googleDaiId, playerId),
  load: (googleDaiId: string, sourceConfig: GoogleDaiSourceConfig) =>
    assertGoogleDaiModuleAvailable().load(googleDaiId, sourceConfig),
  destroy: (googleDaiId: string) =>
    assertGoogleDaiModuleAvailable().destroy(googleDaiId),
} as GoogleDaiModule;

export default GoogleDaiModuleProxy;
