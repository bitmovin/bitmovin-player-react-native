import { requireNativeModule } from 'expo-modules-core';
import { DrmConfig } from './index';

/**
 * Native DrmExpoModule interface using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
interface DrmExpoModuleInterface {
  initializeWithConfig(nativeId: string, config: DrmConfig): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  setPreparedCertificate(nativeId: string, certificate: string): any;
  setPreparedMessage(nativeId: string, message: string): any;
  setPreparedSyncMessage(nativeId: string, syncMessage: string): any;
  setPreparedLicense(nativeId: string, license: string): any;
  setPreparedLicenseServerUrl(nativeId: string, url: string): any;
  setPreparedContentId(nativeId: string, contentId: string): any;
}

/**
 * Expo-based DrmModule implementation.
 * This provides the same functionality as the legacy DrmModule but uses Expo's modern module system.
 */
const DrmExpoModule =
  requireNativeModule<DrmExpoModuleInterface>('DrmExpoModule');

export default DrmExpoModule;
export { DrmExpoModuleInterface };
