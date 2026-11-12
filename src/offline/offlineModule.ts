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
export type NativeOfflineEvents = SharedObject<OfflineEvents>;

/** @internal */
export type NativeOfflineContentManager = SharedObject &
  Omit<NativeMethods<OfflineContentManager>, 'addListener'> & {
    readonly events: NativeOfflineEvents;
  };

declare class OfflineModule extends NativeModule {
  readonly OfflineEvents: new () => NativeOfflineEvents;
  readonly OfflineContentManager: new (
    config: { identifier: string; sourceConfig: Record<string, any> },
    events: NativeOfflineEvents,
    callback: NativeCallback
  ) => NativeOfflineContentManager;
}
const nativeModule = requireNativeModule<OfflineModule>('OfflineModule');
/** @internal */
export const NativeOfflineContentManager = nativeModule.OfflineContentManager;
/** @internal */
export const NativeOfflineEvents = nativeModule.OfflineEvents;
export default nativeModule;
