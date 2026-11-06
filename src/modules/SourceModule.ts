import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { LoadingState, SourceRemoteControlConfig } from '../source';
import type { Thumbnail } from '../thumbnail';
import type { NativeDrm } from '../drm/drmModule';

export type SourceModuleEvents = Record<string, never>;

/** @internal */
export interface NativeSource extends SharedObject<SourceModuleEvents> {
  isAttachedToPlayer(): Promise<boolean | null>;

  isActive(): Promise<boolean | null>;

  destroy(): Promise<void>;

  duration(): Promise<number | null>;

  loadingState(): Promise<LoadingState | null>;

  getMetadata(): Promise<Record<string, any> | null>;

  setMetadata(metadata: Record<string, any> | null): Promise<void>;

  getThumbnail(time: number): Promise<Thumbnail | null>;

  drmFairplayRenewExpiringLicense(skdUri: string): Promise<void>;
}

declare class SourceModule extends NativeModule {
  createEmpty(): NativeSource;
  create(
    config?: Record<string, any>,
    drm?: NativeDrm,
    remoteControl?: SourceRemoteControlConfig,
    analyticsSourceMetadata?: Record<string, any>
  ): Promise<NativeSource>;
}

export default requireNativeModule<SourceModule>('SourceModule');
