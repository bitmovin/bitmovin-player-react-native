import type { SourceEvents } from '../events';
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { LoadingState } from '../source';
import type { Thumbnail } from '../thumbnail';
import type { NativeCallback } from '../native/nativeCallbacks';

export type SourceModuleEvents = SourceEvents;

/** @internal */
export interface NativeSource extends SharedObject<SourceModuleEvents> {
  /** @internal */
  initialize(): Promise<void>;
  /** @internal */
  readonly configSnapshot?: import('../source').SourceConfig;
  isAttachedToPlayer(): Promise<boolean>;

  isActive(): Promise<boolean>;

  duration(): Promise<number>;

  loadingState(): Promise<LoadingState>;

  metadata(): Promise<Record<string, any> | null>;

  setMetadata(metadata: Record<string, any> | null): Promise<void>;

  getThumbnail(time: number): Promise<Thumbnail | null>;

  drmFairplayRenewExpiringLicense(skdUri: string): Promise<void>;
}

declare class SourceModule extends NativeModule {
  readonly Source: new (
    config: Record<string, any>,
    analytics: Record<string, any> | undefined,
    callback: NativeCallback
  ) => NativeSource;
}
const module = requireNativeModule<SourceModule>('SourceModule');
/** @internal */
export const NativeSource = module.Source;
export default module;
