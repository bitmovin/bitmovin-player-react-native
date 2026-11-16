import type { EventSubscription } from 'expo-modules-core';
import type { SourceEventMap, EventCallbacks } from './native/eventMap';
import type { CmcdConfig } from './cmcdConfig';
import type { DrmConfig } from './drm';
import { SourceDrmApi } from './drm/sourceDrmApi';
import type { SideLoadedSubtitleTrack } from './subtitleTrack';
import type { Thumbnail } from './thumbnail';
import type { SourceMetadata } from './analytics';
import { SharedSource } from './modules/sourceModule';

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
 * The different loading states a {@link Source} instance can be in.
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
 * Represents a source configuration that can be loaded into a player instance.
 */
export interface SourceConfig {
  /**
   *  The url for this source configuration.
   */
  url: string;
  /**
   * The `SourceType` for this configuration.
   */
  type: SourceType;
  /**
   * The title of the video source.
   */
  title?: string;
  /**
   * The description of the video source.
   */
  description?: string;
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
  /**
   * The `SourceMetadata` for the {@link Source} to setup custom analytics tracking
   */
  analyticsSourceMetadata?: SourceMetadata;
  /**
   * The CMCD (Common Media Client Data) configuration for this source.
   *
   * @platform iOS 18+, tvOS 18+
   */
  cmcdConfig?: CmcdConfig;
}

/**
 * Represents audio and video content that can be loaded into a player.
 */
export class Source {
  /** @internal Native peer used by Player, playlist and DRM operations. */
  readonly native: SharedSource;
  readonly config?: SourceConfig;

  constructor(config: SourceConfig);
  constructor(config?: SourceConfig, native?: SharedSource) {
    if (native) {
      this.native = Object.assign(native, { source: this });
      this.config = native.configSnapshot;
    } else {
      if (!config) throw new Error('SourceConfig is required');
      this.native = Object.assign(
        new SharedSource(config, config.analyticsSourceMetadata),
        { source: this }
      );
      this.config = config;
    }
    this.drm = new SourceDrmApi(this);
  }

  /** SDK offline loading creates a source without a public constructor. @internal */
  static fromNative(native: SharedSource): Source {
    if (native.source) return native.source;
    // The implementation's second argument is internal; the public constructor accepts configuration only.
    const FromNative = Source as new (
      config: SourceConfig | undefined,
      native: SharedSource
    ) => Source;
    return new FromNative(native.configSnapshot, native);
  }

  /**
   * Provides access to DRM runtime APIs for this source.
   * Use `drm.fairplay` to access {@link FairplayDrmApi} for FairPlay-specific APIs such as {@link FairplayDrmApi.renewExpiringLicense}.
   * Available for every source. Read {@link SourceConfig.drmConfig} to inspect DRM configuration.
   */
  declare readonly drm: SourceDrmApi;

  /**
   * Subscribes to native events, even without a PlayerView. For example,
   * `await source.on('sourceLoaded', listener)`.
   * Use `event` to listen to all supported native object events.
   * Await registration before triggering events. Call `remove()` on the resolved
   * subscription or use off(event, listener) to stop listening.
   */
  on = async <Name extends keyof SourceEventMap>(
    event: Name,
    listener: EventCallbacks<SourceEventMap>[Name]
  ): Promise<EventSubscription> => this.native.addListener(event, listener);

  /** Stops a listener previously registered with on for this event. */
  off = <Name extends keyof SourceEventMap>(
    event: Name,
    listener: EventCallbacks<SourceEventMap>[Name]
  ): void => this.native.removeListener(event, listener);

  /**
   * The duration of the source in seconds if it’s a VoD or `INFINITY` if it’s a live stream.
   * @defaultValue `0` when the duration is unavailable or unknown.
   */
  duration = (): Promise<number> => this.native.duration();

  /**
   * Whether the source is currently active in a player (i.e. playing back or paused).
   * Only one source can be active in the same player instance at any time.
   */
  isActive = (): Promise<boolean> => this.native.isActive();

  /**
   * Whether the source is currently attached to a player instance.
   */
  isAttachedToPlayer = (): Promise<boolean> => this.native.isAttachedToPlayer();

  /**
   * Metadata for the currently loaded source.
   */
  metadata = (): Promise<Record<string, any> | null> => this.native.metadata();

  /**
   * Set metadata for the currently loaded source.
   * Setting the metadata to `null` clears the metadata object in native source.
   *
   * @param metadata metadata to be set.
   */
  setMetadata = (metadata: Record<string, any> | null): Promise<void> =>
    this.native.setMetadata(metadata);

  /**
   * The current `LoadingState` of the source.
   */
  loadingState = (): Promise<LoadingState> => this.native.loadingState();

  /**
   * @returns a `Thumbnail` for the specified playback time if available.
   * Supported thumbnail formats are:
   * - `WebVtt` configured via {@link SourceConfig.thumbnailTrack}, on all supported platforms
   * - HLS `Image Media Playlist` in the multivariant playlist, Android-only
   * - DASH `Image Adaptation Set` as specified in DASH-IF IOP, Android-only
   * If a `WebVtt` thumbnail track is provided, any potential in-manifest thumbnails are ignored on Android.
   *
   * @param time - The time in seconds for which to retrieve the thumbnail.
   */
  getThumbnail = (time: number): Promise<Thumbnail | null> =>
    this.native.getThumbnail(time);
}
