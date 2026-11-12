/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values share their instance type names. */
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../native/nativeCallbacks';
import type { NativeMethods } from '../native/nativeMethods';
import type { Source, SourceConfig } from '../source';
import type { SourceEvents } from '../events';
export type SourceModuleEvents = SourceEvents;
/** @internal */
export type NativeSource = SharedObject<SourceEvents> &
  Omit<NativeMethods<Source>, 'on' | 'off'> & {
    readonly configSnapshot?: SourceConfig;
    readonly source?: Source;
    drmFairplayRenewExpiringLicense(skdUri: string): Promise<void>;
  };

declare class SourceModule extends NativeModule {
  readonly Source: new (
    config: Record<string, any>,
    analytics: Record<string, any> | undefined,
    callback: NativeCallback
  ) => NativeSource;
}
const nativeModule = requireNativeModule<SourceModule>('SourceModule');
/** @internal */
export const NativeSource = nativeModule.Source;
export default nativeModule;
