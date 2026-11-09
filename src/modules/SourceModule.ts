import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type {
  LoadingState,
  Source,
  SourceRemoteControlConfig,
} from '../source';
import { lookup } from '../nativeInstanceRegistry';
import { getNativeOwner, setNativeOwner } from '../nativeOwner';
import type { Thumbnail } from '../thumbnail';
import type { NativeDrmConfig } from '../drm/drmModule';

export type SourceModuleEvents = Record<string, never>;

/** @internal */
export interface NativeSource extends SharedObject<SourceModuleEvents> {
  isAttachedToPlayer(): Promise<boolean | null>;

  isActive(): Promise<boolean | null>;

  duration(): Promise<number | null>;

  loadingState(): Promise<LoadingState | null>;

  getMetadata(): Promise<Record<string, any> | null>;

  setMetadata(metadata: Record<string, any> | null): Promise<void>;

  getThumbnail(time: number): Promise<Thumbnail | null>;

  drmFairplayRenewExpiringLicense(skdUri: string): Promise<void>;
}

/** @internal */
export function getNativeSource(source: Source): NativeSource | undefined {
  const native =
    lookup<NativeSource>('source', source.nativeId) ??
    getNativeOwner<NativeSource>(source);
  if (native) setNativeOwner(source, native);
  return native;
}

declare class SourceModule extends NativeModule {
  create(
    config?: Record<string, any>,
    drm?: NativeDrmConfig,
    remoteControl?: SourceRemoteControlConfig,
    analyticsSourceMetadata?: Record<string, any>
  ): Promise<NativeSource>;
}

export default requireNativeModule<SourceModule>('SourceModule');
