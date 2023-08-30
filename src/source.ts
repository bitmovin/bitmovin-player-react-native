import { NativeModules } from 'react-native';
import { Drm, DrmConfig } from './drm';
import NativeInstance, { NativeInstanceConfig } from './nativeInstance';
import { SideLoadedSubtitleTrack } from './subtitleTrack';

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
 * Types of SourceOptions.
 */
export interface SourceOptions {
  /**
   * The position where the stream should be started.
   * Number can be positive or negative depending on the used `TimelineReferencePoint`.
   * Invalid numbers will be corrected according to the stream boundaries.
   * For VOD this is applied at the time the stream is loaded, for LIVE when playback starts.
   */
  startOffset?: number;
  /**
   * Sets the Timeline reference point to calculate the startOffset from.
   * Default for live: `TimelineReferencePoint.END`.
   * Default for VOD: `TimelineReferencePoint.START`.
   */
  startOffsetTimelineReference?: TimelineReferencePoint;
}

/**
 Timeline reference point to calculate SourceOptions.startOffset from.
 Default for live: TimelineReferencePoint.EBD Default for VOD: TimelineReferencePoint.START.
 */
export enum TimelineReferencePoint {
  /**
   * Relative offset will be calculated from the beginning of the stream or DVR window.
   */
  START = 'start',
  /**
   * Relative offset will be calculated from the end of the stream or the live edge in case of a live stream with DVR window.
   */
  END = 'end',
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
  /**
   * The DRM config for the source.
   */
  drmConfig?: DrmConfig;
  /**
   * External subtitle tracks to be added into the player.
   */
  subtitleTracks?: SideLoadedSubtitleTrack[];
  /**
   * External thumbnails to be added into the player.
   */
  thumbnailTrack?: string;
  /**
   * The optional custom metadata. Also sent to the cast receiver when loading the Source.
   */
  metadata?: Record<string, string>;
  /**
   * The `SourceOptions` for this configuration.
   */
  options?: SourceOptions;
}

/**
 * Represents audio and video content that can be loaded into a player.
 */
export class Source extends NativeInstance<SourceConfig> {
  /**
   * The native DRM config reference of this source.
   */
  drm?: Drm;
  /**
   * Whether the native `Source` object has been created.
   */
  isInitialized = false;
  /**
   * Whether the native `Source` object has been disposed.
   */
  isDestroyed = false;

  /**
   * Allocates the native `Source` instance and its resources natively.
   */
  initialize = () => {
    if (!this.isInitialized) {
      if (this.config?.drmConfig) {
        this.drm = new Drm(this.config.drmConfig);
        this.drm.initialize();
        SourceModule.initWithDrmConfig(
          this.nativeId,
          this.drm.nativeId,
          this.config
        );
      } else {
        SourceModule.initWithConfig(this.nativeId, this.config);
      }
      this.isInitialized = true;
    }
  };

  /**
   * Destroys the native `Source` and releases all of its allocated resources.
   */
  destroy = () => {
    if (!this.isDestroyed) {
      SourceModule.destroy(this.nativeId);
      this.drm?.destroy();
      this.isDestroyed = true;
    }
  };

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
