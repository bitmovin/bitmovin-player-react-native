import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { SourceConfig } from '../source';
import type { NativeDrm } from '../drm/drmModule';
import type { OfflineDownloadRequest } from './offlineDownloadRequest';
import type { BitmovinNativeOfflineEventData } from './offlineContentManagerListener';
import { lookup } from '../nativeInstanceRegistry';
import { Platform } from 'react-native';

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
export function getNativeOffline(id: string): NativeOffline | undefined {
  return lookup<NativeOffline>('offline', id);
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

/** @internal */
export function getOfflineForOperation(
  id: string,
  method: string
): NativeOffline | undefined {
  const native = getNativeOffline(id);
  if (!native && Platform.OS === 'android') {
    throw offlineCompatibilityError(method, id);
  }
  return native;
}

declare class OfflineModule extends NativeModule {
  createEvents(): NativeOfflineEvents;
  create(
    config: { identifier: string; sourceConfig: SourceConfig },
    drm: NativeDrm | undefined,
    events: NativeOfflineEvents
  ): Promise<NativeOfflineBackend>;
}

export default requireNativeModule<OfflineModule>('OfflineModule');
