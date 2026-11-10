import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { LoadingState } from '../source';
import type { Thumbnail } from '../thumbnail';
import type { NativeCallback } from '../native/nativeCallbacks';

export type SourceModuleEvents = Record<string, never>;

/** @internal */
export interface NativeSource extends SharedObject<SourceModuleEvents> {
  isAttachedToPlayer(): Promise<boolean>;

  isActive(): Promise<boolean>;

  duration(): Promise<number>;

  loadingState(): Promise<LoadingState>;

  getMetadata(): Promise<Record<string, any> | null>;

  setMetadata(metadata: Record<string, any> | null): Promise<void>;

  getThumbnail(time: number): Promise<Thumbnail | null>;

  drmFairplayRenewExpiringLicense(skdUri: string): Promise<void>;
}

declare class SourceModule extends NativeModule {
  create(
    config: Record<string, any>,
    analyticsSourceMetadata?: Record<string, any>,
    callback?: NativeCallback
  ): Promise<NativeSource>;
}

export default requireNativeModule<SourceModule>('SourceModule');
