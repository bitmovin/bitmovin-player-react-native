import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { SourceConfig } from '../source';
import type { NativeCallback } from '../native/nativeCallbacks';
import type { OfflineDownloadRequest } from './offlineDownloadRequest';
import type { BitmovinNativeOfflineEventData } from './offlineContentManagerListener';

type OfflineEvents = {
  onBitmovinOfflineEvent: (
    event: Omit<BitmovinNativeOfflineEventData, 'nativeId'>
  ) => void;
};

/** @internal */
export type NativeOfflineEvents = SharedObject<OfflineEvents>;

/** @internal */
export interface NativeOfflineBackend extends SharedObject {
  getState(): Promise<string | null>;
  getOptions(): Promise<void>;
  download(request: OfflineDownloadRequest): Promise<void>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  cancelDownload(): Promise<void>;
  usedStorage(): Promise<number | null>;
  deleteAll(): Promise<void>;
  downloadLicense(): Promise<void>;
  releaseLicense(): Promise<void>;
  renewOfflineLicense(): Promise<void>;
  destroy(): Promise<void>;
}

/** @internal */
export type NativeOffline = NativeOfflineBackend & {
  readonly events: NativeOfflineEvents;
};

declare class OfflineModule extends NativeModule {
  createEvents(): NativeOfflineEvents;
  create(
    config: { identifier: string; sourceConfig: SourceConfig },
    events: NativeOfflineEvents,
    callback?: NativeCallback
  ): Promise<NativeOfflineBackend>;
}

export default requireNativeModule<OfflineModule>('OfflineModule');
