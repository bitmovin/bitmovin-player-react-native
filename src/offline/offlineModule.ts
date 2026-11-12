/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values intentionally share their instance interface names. */
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../native/nativeCallbacks';
import type { OfflineContentManager } from './offlineContentManager';
import type { NativeMethods } from '../native/nativeMethods';
import type { BitmovinNativeOfflineEventData } from './offlineContentManagerListener';

type OfflineEvents = {
  onBitmovinOfflineEvent: (
    event: Omit<BitmovinNativeOfflineEventData, 'nativeId'>
  ) => void;
};

/** @internal */
export type SharedOfflineEvents = SharedObject<OfflineEvents>;

/** @internal */
export type SharedOfflineContentManager = SharedObject &
  Omit<NativeMethods<OfflineContentManager>, 'addListener'> & {
    readonly events: SharedOfflineEvents;
  };

declare class OfflineModule extends NativeModule {
  readonly SharedOfflineEvents: new () => SharedOfflineEvents;
  readonly SharedOfflineContentManager: new (
    config: { identifier: string; sourceConfig: Record<string, any> },
    events: SharedOfflineEvents,
    callback: NativeCallback
  ) => SharedOfflineContentManager;
}
const nativeModule = requireNativeModule<OfflineModule>('OfflineModule');
/** @internal */
export const SharedOfflineContentManager =
  nativeModule.SharedOfflineContentManager;
/** @internal */
export const SharedOfflineEvents = nativeModule.SharedOfflineEvents;
export default nativeModule;
