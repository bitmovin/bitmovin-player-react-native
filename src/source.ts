import type { EventSubscription } from 'expo-modules-core';
import type { SourceEvents } from './events';
import { subscribeToNativeEvent } from './nativeEvents';
import type { CmcdConfig } from './cmcdConfig';
import type { DrmConfig } from './drm';
import { SourceDrmApi } from './drm/sourceDrmApi';
import type { SideLoadedSubtitleTrack } from './subtitleTrack';
import type { Thumbnail } from './thumbnail';
import type { SourceMetadata } from './analytics';
import { NativeSource } from './modules/sourceModule';
import { adoptNative } from './native/adoptNative';
import { NativeConfigSerializer } from './native/nativeConfigSerializer';

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
 * Represents a source configuration that be loaded into a player instance.
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
export class Source extends NativeSource {
  readonly config?: SourceConfig;

  constructor(config: SourceConfig) {
    const callbacks = new NativeConfigSerializer();
    super(
      callbacks.serialize(config),
      callbacks.serialize(config.analyticsSourceMetadata),
      callbacks.dispatcher.callback
    );
    callbacks.dispatcher.retain(this);
    this.config = config;
    this.drm = new SourceDrmApi(this);
    this.bindMethods();
  }

  /**
   * SDK offline loading creates content without calling the JS constructor.
   * Promote that existing peer; ordinary source queries return the original instance.
   * @internal
   */
  static fromNative(native: NativeSource): Source {
    return adoptNative(native, Source.prototype, (owner) => {
      if (!Object.hasOwn(owner, 'drm')) {
        // This native peer skipped the JS constructor; install the same instance fields once.
        Object.assign(owner, {
          config: owner.configSnapshot,
          drm: new SourceDrmApi(owner),
        });
        owner.bindMethods();
      }
    });
  }

  // SDK-created peers skip JS field initializers, so both creation paths bind here.
  private bindMethods(): void {
    this.duration = super.duration.bind(this);
    this.isActive = super.isActive.bind(this);
    this.isAttachedToPlayer = super.isAttachedToPlayer.bind(this);
    this.metadata = super.metadata.bind(this);
    this.setMetadata = super.setMetadata.bind(this);
    this.loadingState = super.loadingState.bind(this);
    this.getThumbnail = super.getThumbnail.bind(this);
    this.on = this.on.bind(this);
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
   * subscription to stop listening.
   */
  async on<Name extends keyof SourceEvents>(
    event: Name,
    listener: SourceEvents[Name]
  ): Promise<EventSubscription> {
    return subscribeToNativeEvent(this, event, listener);
  }

  /**
   * The duration of the source in seconds if it’s a VoD or `INFINITY` if it’s a live stream.
   * @defaultValue `0` when the duration is unavailable or unknown.
   */
  declare duration: () => Promise<number>;

  /**
   * Whether the source is currently active in a player (i.e. playing back or paused).
   * Only one source can be active in the same player instance at any time.
   */
  declare isActive: () => Promise<boolean>;

  /**
   * Whether the source is currently attached to a player instance.
   */
  declare isAttachedToPlayer: () => Promise<boolean>;

  /**
   * Metadata for the currently loaded source.
   */
  declare metadata: () => Promise<Record<string, any> | null>;

  /**
   * Set metadata for the currently loaded source.
   * Setting the metadata to `null` clears the metadata object in native source.
   *
   * @param metadata metadata to be set.
   */
  declare setMetadata: (metadata: Record<string, any> | null) => Promise<void>;

  /**
   * The current `LoadingState` of the source.
   */
  declare loadingState: () => Promise<LoadingState>;

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
  declare getThumbnail: (time: number) => Promise<Thumbnail | null>;
}
