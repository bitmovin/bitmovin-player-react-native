import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { DrmConfig } from './index';

export type DrmExpoModuleEvents = Record<string, any>;

/**
 * Native DrmExpoModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class DrmExpoModule extends NativeModule<DrmExpoModuleEvents> {
  initializeWithConfig(nativeId: string, config: DrmConfig): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  setPreparedCertificate(nativeId: string, certificate: string): any;
  setPreparedMessage(nativeId: string, message: string): any;
  setPreparedSyncMessage(nativeId: string, syncMessage: string): any;
  setPreparedLicense(nativeId: string, license: string): any;
  setPreparedLicenseServerUrl(nativeId: string, url: string): any;
  setPreparedContentId(nativeId: string, contentId: string): any;
}

export default requireNativeModule<DrmExpoModule>('DrmExpoModule');
