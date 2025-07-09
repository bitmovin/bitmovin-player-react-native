import { requireNativeModule } from 'expo-modules-core';
import { SourceConfig } from '../source';
import { OfflineDownloadRequest } from './offlineDownloadRequest';

/**
 * Native OfflineExpoModule interface using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
interface OfflineExpoModuleInterface {
  initializeWithConfig(
    nativeId: string,
    config: { identifier: string; sourceConfig: SourceConfig },
    drmNativeId: string | undefined
  ): Promise<void>;

  getState(nativeId: string): Promise<string>;

  getOptions(nativeId: string): Promise<void>;

  download(nativeId: string, request: OfflineDownloadRequest): Promise<void>;

  resume(nativeId: string): Promise<void>;

  suspend(nativeId: string): Promise<void>;

  cancelDownload(nativeId: string): Promise<void>;

  usedStorage(nativeId: string): Promise<number>;

  deleteAll(nativeId: string): Promise<void>;

  downloadLicense(nativeId: string): Promise<void>;

  releaseLicense(nativeId: string): Promise<void>;

  renewOfflineLicense(nativeId: string): Promise<void>;

  release(nativeId: string): Promise<void>;

  // Event support
  addListener?: (
    eventName: string,
    listener: (event: any) => void
  ) => { remove: () => void };
  removeListeners?: (count: number) => void;
}

/**
 * Expo-based OfflineModule implementation.
 * This provides the same functionality as the legacy OfflineModule but uses Expo's modern module system.
 */
const OfflineExpoModule =
  requireNativeModule<OfflineExpoModuleInterface>('OfflineExpoModule');

export default OfflineExpoModule;
export { OfflineExpoModuleInterface };
