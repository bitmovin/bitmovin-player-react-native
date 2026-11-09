import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { SourceConfig } from '../source';
import type { NativeCallback } from '../nativeCallbacks';
import type { OfflineDownloadRequest } from './offlineDownloadRequest';
import type { BitmovinNativeOfflineEventData } from './offlineContentManagerListener';
import { lookup } from '../nativeInstanceRegistry';
import { getNativeOwner, setNativeOwner } from '../nativeOwner';

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

/** @internal */
export function getNativeOffline(owner: {
  readonly nativeId: string;
}): NativeOffline | undefined {
  const native =
    lookup<NativeOffline>('offline', owner.nativeId) ??
    getNativeOwner<NativeOffline>(owner);
  if (native) setNativeOwner(owner, native);
  return native;
}

/** @internal */
export function offlineCompatibilityError(
  method: string,
  id: string,
  duplicate = false
): Error & { code: string } {
  const reason = duplicate
    ? `Content manager bridge id already exists: ${id}`
    : `No offline content manager bridge for id ${id}`;
  return Object.assign(
    new Error(
      `Call to function 'OfflineModule.${method}' has been rejected.\n→ Caused by: ${reason}`
    ),
    { code: duplicate ? 'ERR_MANAGER_ALREADY_EXISTS' : 'ERR_MANAGER_NOT_FOUND' }
  );
}

declare class OfflineModule extends NativeModule {
  createEvents(): NativeOfflineEvents;
  create(
    config: { identifier: string; sourceConfig: SourceConfig },
    events: NativeOfflineEvents,
    callback?: NativeCallback
  ): Promise<NativeOfflineBackend>;
}

export default requireNativeModule<OfflineModule>('OfflineModule');
