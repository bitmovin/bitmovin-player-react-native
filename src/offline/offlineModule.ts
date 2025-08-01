import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { SourceConfig } from '../source';
import { OfflineDownloadRequest } from './offlineDownloadRequest';
import { BitmovinNativeOfflineEventData } from './offlineContentManagerListener';

export type OfflineModuleEvents = {
  onBitmovinOfflineEvent: (event: BitmovinNativeOfflineEventData) => void;
};

/**
 * Native OfflineModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class OfflineModule extends NativeModule<OfflineModuleEvents> {
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
}

export default requireNativeModule<OfflineModule>('OfflineModule');
