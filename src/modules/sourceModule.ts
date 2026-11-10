import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { LoadingState, SourceRemoteControlConfig } from '../source';
import type { Thumbnail } from '../thumbnail';
import type { NativeEventPayload } from '../utils/eventListeners';
import type { NativeCallback } from '../native/nativeCallbacks';

export type SourceModuleEvents = {
  onSourceEvent: (payload: NativeEventPayload) => void;
  /**
   * Emitted once native released a source, e.g. after its player removed it. `instanceId` identifies the released
   * native source, as resolved by its initialization.
   */
  onSourceReleased: (payload: { nativeId: string; instanceId: number }) => void;
};

/** @internal Shared handle used by migrated Source APIs. */
export interface NativeSource extends SharedObject {
  readonly legacyInstanceId: number;
  drmFairplayRenewExpiringLicense(skdUri: string): Promise<void>;
  isAttachedToPlayer(): Promise<boolean>;
  isActive(): Promise<boolean>;
  duration(): Promise<number>;
  loadingState(): Promise<LoadingState>;
  getMetadata(): Promise<Record<string, any> | null>;
  setMetadata(metadata: Record<string, any> | null): Promise<void>;
  getThumbnail(time: number): Promise<Thumbnail | null>;
}

declare class SourceModule extends NativeModule<SourceModuleEvents> {
  /** @internal */
  getSharedSource(nativeId: string): Promise<NativeSource>;

  /**
   * Attaches a native listener for `eventName` to the source with the given nativeId.
   */
  on(nativeId: string, eventName: string): Promise<void>;

  /**
   * Detaches the native listener for `eventName` from the source with the given nativeId.
   */
  off(nativeId: string, eventName: string): Promise<void>;

  /**
   * Initializes a source with the given nativeId, configuration object,
   * and remote control object.
   *
   * Resolves the canonical native source, creating it if necessary.
   */
  initializeWithConfig(
    nativeId: string,
    config?: Record<string, any>,
    remoteControl?: SourceRemoteControlConfig,
    callback?: NativeCallback
  ): Promise<NativeSource>;

  /**
   * Initializes a source with the given nativeId, configuration object,
   * remote control object, and analytics source metadata.
   *
   * Resolves the canonical native source, creating it if necessary.
   */
  initializeWithAnalyticsConfig(
    nativeId: string,
    config?: Record<string, any>,
    remoteControl?: SourceRemoteControlConfig,
    analyticsSourceMetadata?: Record<string, any>,
    callback?: NativeCallback
  ): Promise<NativeSource>;

  /**
   * Destroys the source with the given nativeId.
   */
  destroy(nativeId: string): Promise<void>;
}

export default requireNativeModule<SourceModule>('SourceModule');
