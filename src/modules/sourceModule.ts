/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values share their instance type names. */
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeMethods } from '../native/nativeMethods';
import type { Source, SourceConfig } from '../source';
import type { SourceEventMap, EventCallbacks } from '../native/eventMap';
export type SourceModuleEvents = EventCallbacks<SourceEventMap>;
/** @internal */
export type SharedSource = SharedObject<EventCallbacks<SourceEventMap>> &
  Omit<NativeMethods<Source>, 'on' | 'off'> & {
    readonly configSnapshot?: SourceConfig;
    readonly source?: Source;
    drmFairplayRenewExpiringLicense(skdUri: string): Promise<void>;
  };

declare class SourceModule extends NativeModule {
  readonly SharedSource: new (
    config: SourceConfig,
    analytics: SourceConfig['analyticsSourceMetadata']
  ) => SharedSource;
}
const nativeModule = requireNativeModule<SourceModule>('SourceModule');
/** @internal */
export const SharedSource = nativeModule.SharedSource;
export default nativeModule;
