/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values intentionally share their instance interface names. */
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
export interface NativeOffline extends SharedObject {
  /** @internal */
  readonly events: NativeOfflineEvents;
  state(): Promise<import('./offlineState').OfflineState>;
  getOptions(): Promise<void>;
  download(request: OfflineDownloadRequest): Promise<void>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  cancelDownload(): Promise<void>;
  usedStorage(): Promise<number>;
  deleteAll(): Promise<void>;
  downloadLicense(): Promise<void>;
  releaseLicense(): Promise<void>;
  renewOfflineLicense(): Promise<void>;
  destroy(): Promise<void>;
}

declare class OfflineModule extends NativeModule {
  readonly OfflineEvents: new () => NativeOfflineEvents;
  readonly OfflineContentManager: new (
    config: { identifier: string; sourceConfig: SourceConfig },
    events: NativeOfflineEvents,
    callback: NativeCallback
  ) => NativeOffline;
}
const nativeModule = requireNativeModule<OfflineModule>('OfflineModule');
/** @internal */
export const NativeOffline = nativeModule.OfflineContentManager;
/** @internal */
export const NativeOfflineEvents = nativeModule.OfflineEvents;
export default nativeModule;
