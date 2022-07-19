import { NativeModules } from 'react-native';
import NativeInstance, { NativeInstanceConfig } from './nativeInstance';
import { DRM, DRMConfig } from './drm';

const SourceModule = NativeModules.SourceModule;

/**
 * Types of media that can be handled by the player.
 */
export enum SourceType {
  /**
   * Indicates a missing source type.
   */
  NONE = 'none',
  /**
   * Indicates media type HLS.
   */
  HLS = 'hls',
  /**
   * Indicates media type DASH.
   */
  DASH = 'dash',
  /**
   * Indicates media type Progressive MP4.
   */
  PROGRESSIVE = 'progressive',
}

/**
 * The different loading states a `Source` instance can be in.
 */
export enum LoadingState {
  /**
   * The source is unloaded.
   */
  UNLOADED = 0,
  /**
   * The source is currently loading.
   */
  LOADING = 1,
  /**
   * The source is loaded.
   */
  LOADED = 2,
}

/**
 * Represents a source configuration that be loaded into a player instance.
 */
export interface SourceConfig extends NativeInstanceConfig {
  /**
   *  The url for this source configuration.
   */
  url: string;
  /**
   * The `SourceType` for this configuration.
   */
  type?: SourceType;
  /**
   * The title of the video source.
   */
  title?: string;
  /**
   * The URL to a preview image displayed until the video starts.
   */
  poster?: string;
  /**
   * Indicates whether to show the poster image during playback.
   * Useful, for example, for audio-only streams.
   */
  isPosterPersistent?: boolean;

  drmConfig?: DRMConfig;
}

/**
 * Represents audio and video content that can be loaded into a player.
 */
export class Source extends NativeInstance<SourceConfig> {
  /**
   * The DRM config for the source.
   */
  readonly drm?: DRM;

  constructor(config?: SourceConfig) {
    super(config);
    if (config?.drmConfig) {
      this.drm = new DRM(config.drmConfig!);
      SourceModule.initWithDRMConfig(
        this.nativeId,
        this.drm.nativeId,
        this.config
      );
    } else {
      SourceModule.initWithConfig(this.nativeId, this.config);
    }
  }

  /**
   * The duration of the source in seconds if it’s a VoD or `INFINITY` if it’s a live stream.
   * Default value is `0` if the duration is not available or not known.
   */
  duration = async (): Promise<number> => {
    return SourceModule.duration(this.nativeId);
  };

  /**
   * Whether the source is currently active in a player (i.e. playing back or paused).
   * Only one source can be active in the same player instance at any time.
   */
  isActive = async (): Promise<boolean> => {
    return SourceModule.isActive(this.nativeId);
  };

  /**
   * Whether the source is currently attached to a player instance.
   */
  isAttachedToPlayer = async (): Promise<boolean> => {
    return SourceModule.isAttachedToPlayer(this.nativeId);
  };

  /**
   * Metadata for the currently loaded source.
   */
  metadata = async (): Promise<Record<string, any> | null> => {
    return SourceModule.getMetadata(this.nativeId);
  };

  /**
   * Set metadata for the currently loaded source.
   * Setting the metadata to `null` clears the metadata object in native source.
   */
  setMetadata = (metadata: Record<string, any> | null): void => {
    SourceModule.setMetadata(this.nativeId, metadata);
  };

  /**
   * The current `LoadingState` of the source.
   */
  loadingState = async (): Promise<LoadingState> => {
    return SourceModule.loadingState(this.nativeId);
  };
}
