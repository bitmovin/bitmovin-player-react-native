import type { EventSubscription } from 'expo-modules-core';
import type { SourceEvents } from './events';
import { subscribeToNativeEvent } from './nativeEvents';
import type { CmcdConfig } from './cmcdConfig';
import type { DrmConfig } from './drm';
import { SourceDrmApi } from './drm/sourceDrmApi';
import type { NativeInstanceConfig } from './nativeInstance';
import NativeInstance from './nativeInstance';
import { getOrCreateAsync } from './nativeInstanceRegistry';
import type { SideLoadedSubtitleTrack } from './subtitleTrack';
import type { Thumbnail } from './thumbnail';
import type { SourceMetadata } from './analytics';
import SourceModule from './modules/SourceModule';
import {
  createConfigurationCallbacks,
  createSharedObjectWithCallback,
} from './nativeCallbacks';
import { setNativeOwner } from './nativeOwner';

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
export interface SourceConfig extends NativeInstanceConfig {
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
 * The remote control config for a source.
 * @platform iOS
 */
export interface SourceRemoteControlConfig {
  /**
   * The `SourceConfig` for casting.
   * Enables to play different content when casting.
   * This can be useful when the remote playback device supports different streaming formats,
   * DRM systems, etc. than the local device.
   * If not set, the local source config will be used for casting.
   */
  castSourceConfig?: SourceConfig | null;
}

/**
 * Represents audio and video content that can be loaded into a player.
 */
export class Source extends NativeInstance<SourceConfig> {
  /**
   * Subscribes to native events, even without a PlayerView. For example,
   * `await source.on('sourceLoaded', listener)`.
   * Use `event` to listen to all supported native object events.
   * Await registration before triggering events. Call `remove()` on the resolved
   * subscription to stop listening.
   */
  on = async <Name extends keyof SourceEvents>(
    event: Name,
    listener: SourceEvents[Name]
  ): Promise<EventSubscription> =>
    subscribeToNativeEvent(this.native, event, listener);

  private get native() {
    return getOrCreateAsync('source', this.nativeId, () => {
      const callbacks = createConfigurationCallbacks();
      return createSharedObjectWithCallback(
        (callback) =>
          SourceModule.create(
            callbacks.serialize(this.config),
            callbacks.serialize(this.remoteControl || undefined),
            callbacks.serialize(this.config.analyticsSourceMetadata),
            callback
          ),
        callbacks.callback
      );
    }).then((native) => {
      setNativeOwner(this, native);
      this.isInitialized = true;
      return native;
    });
  }

  /**
   * Provides access to DRM runtime APIs for this source.
   * Use `drm.fairplay` to access {@link FairplayDrmApi} for FairPlay-specific APIs such as {@link FairplayDrmApi.renewExpiringLicense}.
   * Available for every source. Read {@link SourceConfig.drmConfig} to inspect DRM configuration.
   */
  readonly drm = new SourceDrmApi(() => this.native);

  /**
   * The remote control config for this source.
   * This is only supported on iOS.
   *
   * @platform iOS
   */
  remoteControl: SourceRemoteControlConfig | null = null;
  /**
   * Whether the native {@link Source} object has been created.
   */
  isInitialized = false;

  /**
   * Allocates the native {@link Source} instance and its resources natively.
   */
  initialize = async (): Promise<void> => {
    await this.native;
  };

  /**
   * The duration of the source in seconds if it’s a VoD or `INFINITY` if it’s a live stream.
   * Default value is `0` if the duration is not available or not known.
   */
  duration = async (): Promise<number> => {
    return (await this.native).duration();
  };

  /**
   * Whether the source is currently active in a player (i.e. playing back or paused).
   * Only one source can be active in the same player instance at any time.
   */
  isActive = async (): Promise<boolean> => {
    return (await this.native).isActive();
  };

  /**
   * Whether the source is currently attached to a player instance.
   */
  isAttachedToPlayer = async (): Promise<boolean> => {
    return (await this.native).isAttachedToPlayer();
  };

  /**
   * Metadata for the currently loaded source.
   */
  metadata = async (): Promise<Record<string, any> | null> => {
    return (await this.native).getMetadata();
  };

  /**
   * Set metadata for the currently loaded source.
   * Setting the metadata to `null` clears the metadata object in native source.
   *
   * @param metadata metadata to be set.
   */
  setMetadata = (metadata: Record<string, any> | null): void => {
    void this.native.then((native) => native.setMetadata(metadata));
  };

  /**
   * The current `LoadingState` of the source.
   */
  loadingState = async (): Promise<LoadingState> => {
    return (await this.native).loadingState();
  };

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
  getThumbnail = async (time: number): Promise<Thumbnail | null> => {
    return (await this.native).getThumbnail(time);
  };
}
