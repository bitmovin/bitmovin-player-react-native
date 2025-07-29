import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { LoadingState, SourceRemoteControlConfig } from '../source';
import { Thumbnail } from '../thumbnail';

export type SourceModuleEvents = Record<string, any>;

declare class SourceModule extends NativeModule<SourceModuleEvents> {
  /**
   * Checks if the source is attached to a player.
   */
  isAttachedToPlayer(nativeId: string): Promise<boolean | null>;

  /**
   * Checks if the source is currently active.
   */
  isActive(nativeId: string): Promise<boolean | null>;

  /**
   * Initializes a source with the given nativeId, optional DRM nativeId, configuration object,
   * and remote control object.
   */
  initializeWithConfig(
    nativeId: string,
    drmNativeId?: string,
    config?: Record<string, any>,
    remoteControl?: SourceRemoteControlConfig
  ): Promise<void>;

  /**
   * Initializes a source with the given nativeId, optional DRM nativeId, configuration object,
   * remote control object, and analytics source metadata.
   */
  initializeWithAnalyticsConfig(
    nativeId: string,
    drmNativeId?: string,
    config?: Record<string, any>,
    remoteControl?: SourceRemoteControlConfig,
    analyticsSourceMetadata?: Record<string, any>
  ): Promise<void>;

  /**
   * Destroys the source with the given nativeId.
   */
  destroy(nativeId: string): Promise<void>;

  /**
   * Returns the native DRM config reference of the source with the given nativeId.
   */
  duration(nativeId: string): Promise<number | null>;
  /**
   * Returns the current loading state of the source with the given nativeId.
   */
  loadingState(nativeId: string): Promise<LoadingState | null>;

  /**
   * Returns the metadata of the source with the given nativeId.
   */
  getMetadata(nativeId: string): Promise<Record<string, any> | null>;

  /**
   * Sets the metadata of the source with the given nativeId.
   */
  setMetadata(
    nativeId: string,
    metadata: Record<string, any> | null
  ): Promise<void>;

  /**
   * Returns a thumbnail for the specified playback time.
   */
  getThumbnail(nativeId: string, time: number): Promise<Thumbnail | null>;
}

export default requireNativeModule<SourceModule>('SourceModule');
