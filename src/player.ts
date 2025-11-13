import { EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';
import PlayerModule from './modules/PlayerModule';
import NativeInstance from './nativeInstance';
import { Source, SourceConfig } from './source';
import { AudioTrack } from './audioTrack';
import { SubtitleTrack } from './subtitleTrack';
import { OfflineContentManager, OfflineSourceOptions } from './offline';
import { Thumbnail } from './thumbnail';
import { AnalyticsApi } from './analytics/player';
import { PlayerConfig } from './playerConfig';
import { AdItem, ImaSettings } from './advertising';
import { BufferApi } from './bufferApi';
import { VideoQuality } from './media';
import { Network } from './network';
import { DecoderConfigBridge } from './decoder';

/**
 * Loads, controls and renders audio and video content represented through {@link Source}s. A player
 * instance can be created via the {@link usePlayer} hook and will idle until one or more {@link Source}s are
 * loaded. Once {@link Player.load} or {@link Player.loadSource} is called, the player becomes active and initiates necessary downloads to
 * start playback of the loaded source(s).
 *
 * Can be attached to {@link PlayerView} component in order to use Bitmovin's Player Web UI.
 * @see PlayerView
 */
export class Player extends NativeInstance<PlayerConfig> {
  /**
   * Whether the native `Player` object has been created.
   */
  isInitialized = false;
  /**
   * Whether the native `Player` object has been disposed.
   */
  isDestroyed = false;
  /**
   * Currently active source, or `null` if none is active.
   */
  source?: Source;
  /**
   * The `AnalyticsApi` for interactions regarding the `Player`'s analytics.
   *
   * `undefined` if the player was created without analytics support.
   */
  analytics?: AnalyticsApi = undefined;
  /**
   * The {@link BufferApi} for interactions regarding the buffer.
   */
  buffer: BufferApi = new BufferApi(this.nativeId);

  private network?: Network;

  private decoderConfig?: DecoderConfigBridge;
  private onImaBeforeInitializationSubscription?: EventSubscription;
  /**
   * Allocates the native `Player` instance and its resources natively.
   */
  initialize = async (): Promise<void> => {
    if (!this.isInitialized) {
      this.ensureImaBeforeInitializationListener();
      if (this.config?.networkConfig) {
        this.network = new Network(this.config.networkConfig);
        await this.network.initialize();
      }
      await this.maybeInitDecoderConfig();
      const analyticsConfig = this.config?.analyticsConfig;
      if (analyticsConfig) {
        await PlayerModule.initializeWithAnalyticsConfig(
          this.nativeId,
          analyticsConfig,
          this.config,
          this.network?.nativeId,
          this.decoderConfig?.nativeId
        );
        this.analytics = new AnalyticsApi(this.nativeId);
      } else {
        await PlayerModule.initializeWithConfig(
          this.nativeId,
          this.config,
          this.network?.nativeId,
          this.decoderConfig?.nativeId
        );
      }

      this.isInitialized = true;
    }
    return Promise.resolve();
  };

  /**
   * Destroys the native `Player` and releases all of its allocated resources.
   */
  destroy = () => {
    if (!this.isDestroyed) {
      PlayerModule.destroy(this.nativeId);
      this.source?.destroy();
      this.network?.destroy();
      this.decoderConfig?.destroy();
      this.onImaBeforeInitializationSubscription?.remove();
      this.onImaBeforeInitializationSubscription = undefined;
      this.isDestroyed = true;
    }
  };

  /**
   * Loads a new {@link Source} from `sourceConfig` into the player.
   */
  load = (sourceConfig: SourceConfig) => {
    this.loadSource(new Source(sourceConfig));
  };

  /**
   * Loads the downloaded content from {@link OfflineContentManager} into the player.
   */
  loadOfflineContent = (
    offlineContentManager: OfflineContentManager,
    options?: OfflineSourceOptions
  ) => {
    PlayerModule.loadOfflineContent(
      this.nativeId,
      offlineContentManager.nativeId,
      options
    );
  };

  /**
   * Loads the given {@link Source} into the player.
   */
  loadSource = (source: Source) => {
    this.source = source;
    source.initialize().then(() => {
      PlayerModule.loadSource(this.nativeId, source.nativeId);
    });
  };

  /**
   * Unloads all {@link Source}s from the player.
   */
  unload = () => {
    PlayerModule.unload(this.nativeId);
  };

  /**
   * Starts or resumes playback after being paused. Has no effect if the player is already playing.
   */
  play = () => {
    PlayerModule.play(this.nativeId);
  };

  /**
   * Pauses the video if it is playing. Has no effect if the player is already paused.
   */
  pause = () => {
    PlayerModule.pause(this.nativeId);
  };

  /**
   * Seeks to the given playback time specified by the parameter `time` in seconds. Must not be
   * greater than the total duration of the video. Has no effect when watching a live stream since
   * seeking is not possible.
   *
   * @param time - The time to seek to in seconds.
   */
  seek = (time: number) => {
    PlayerModule.seek(this.nativeId, time);
  };

  /**
   * Shifts the time to the given `offset` in seconds from the live edge. The resulting offset has to be within the
   * timeShift window as specified by `maxTimeShift` (which is a negative value) and 0. When the provided `offset` is
   * positive, it will be interpreted as a UNIX timestamp in seconds and converted to fit into the timeShift window.
   * When the provided `offset` is negative, but lower than `maxTimeShift`, then it will be clamped to `maxTimeShift`.
   * Has no effect for VoD.
   *
   * Has no effect if no sources are loaded.
   *
   * @param offset - Target offset from the live edge in seconds.
   */
  timeShift = (offset: number) => {
    PlayerModule.timeShift(this.nativeId, offset);
  };

  /**
   * Mutes the player if an audio track is available. Has no effect if the player is already muted.
   */
  mute = () => {
    PlayerModule.mute(this.nativeId);
  };

  /**
   * Unmutes the player if it is muted. Has no effect if the player is already unmuted.
   */
  unmute = () => {
    PlayerModule.unmute(this.nativeId);
  };

  /**
   * Sets the player's volume between 0 (silent) and 100 (max volume).
   *
   * @param volume - The volume level to set.
   */
  setVolume = (volume: number) => {
    PlayerModule.setVolume(this.nativeId, volume);
  };

  private ensureImaBeforeInitializationListener = () => {
    const callback = this.config?.advertisingConfig?.ima?.beforeInitialization;
    if (!callback) {
      return;
    }
    if (this.onImaBeforeInitializationSubscription) {
      return;
    }
    this.onImaBeforeInitializationSubscription = PlayerModule.addListener(
      'onImaBeforeInitialization',
      ({ nativeId, id, settings }) => {
        if (nativeId !== this.nativeId) {
          return;
        }
        const cloned: ImaSettings = { ...settings };
        let prepared = cloned;
        try {
          const result = callback(cloned);
          prepared =
            result && typeof result === 'object'
              ? { ...cloned, ...result }
              : cloned;
        } catch {
          prepared = cloned;
        }
        PlayerModule.setPreparedImaSettings(id, prepared);
      }
    );
  };

  /**
   * @returns The player's current volume level.
   */
  getVolume = async (): Promise<number> => {
    return (await PlayerModule.getVolume(this.nativeId)) ?? 0;
  };

  /**
   * @returns The current playback time in seconds.
   *
   * For VoD streams the returned time ranges between 0 and the duration of the asset.
   *
   * For live streams it can be specified if an absolute UNIX timestamp or a value
   * relative to the playback start should be returned.
   *
   * @param mode - The time mode to specify: an absolute UNIX timestamp ('absolute') or relative time ('relative').
   */
  getCurrentTime = async (
    mode: 'relative' | 'absolute' = 'absolute'
  ): Promise<number> => {
    return (await PlayerModule.currentTime(this.nativeId, mode)) ?? 0;
  };

  /**
   * @returns The total duration in seconds of the current video or INFINITY if it’s a live stream.
   */
  getDuration = async (): Promise<number> => {
    return (await PlayerModule.duration(this.nativeId)) ?? 0;
  };

  /**
   * @returns `true` if the player is muted.
   */
  isMuted = async (): Promise<boolean> => {
    return (await PlayerModule.isMuted(this.nativeId)) ?? false;
  };

  /**
   * @returns `true` if the player is currently playing, i.e. has started and is not paused.
   */
  isPlaying = async (): Promise<boolean> => {
    return (await PlayerModule.isPlaying(this.nativeId)) ?? false;
  };

  /**
   * @returns `true` if the player has started playback but it's currently paused.
   */
  isPaused = async (): Promise<boolean> => {
    return (await PlayerModule.isPaused(this.nativeId)) ?? false;
  };

  /**
   * @returns `true` if the displayed video is a live stream.
   */
  isLive = async (): Promise<boolean> => {
    return (await PlayerModule.isLive(this.nativeId)) ?? false;
  };

  /**
   * @platform iOS
   * @returns `true` when media is played externally using AirPlay.
   */
  isAirPlayActive = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method isAirPlayActive is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return (await PlayerModule.isAirPlayActive(this.nativeId)) ?? false;
  };

  /**
   * @platform iOS
   * @returns `true` when AirPlay is available.
   */
  isAirPlayAvailable = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method isAirPlayAvailable is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return (await PlayerModule.isAirPlayAvailable(this.nativeId)) ?? false;
  };

  /**
   * @returns The currently selected audio track or `null`.
   */
  getAudioTrack = async (): Promise<AudioTrack | null> => {
    return PlayerModule.getAudioTrack(this.nativeId);
  };

  /**
   * @returns An array containing {@link AudioTrack} objects for all available audio tracks.
   */
  getAvailableAudioTracks = async (): Promise<AudioTrack[]> => {
    return PlayerModule.getAvailableAudioTracks(this.nativeId);
  };

  /**
   * Sets the audio track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableAudioTracks.
   *
   * @param trackIdentifier - The {@link AudioTrack.identifier} to be set.
   */
  setAudioTrack = async (trackIdentifier: string): Promise<void> => {
    return PlayerModule.setAudioTrack(this.nativeId, trackIdentifier);
  };

  /**
   * @returns The currently selected {@link SubtitleTrack} or `null`.
   */
  getSubtitleTrack = async (): Promise<SubtitleTrack | null> => {
    return PlayerModule.getSubtitleTrack(this.nativeId);
  };

  /**
   * @returns An array containing SubtitleTrack objects for all available subtitle tracks.
   */
  getAvailableSubtitles = async (): Promise<SubtitleTrack[]> => {
    return PlayerModule.getAvailableSubtitles(this.nativeId);
  };

  /**
   * Sets the subtitle track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableSubtitles.
   * Pass `undefined` to disable subtitles.
   *
   * @param trackIdentifier - The {@link SubtitleTrack.identifier} to be set.
   */
  setSubtitleTrack = async (trackIdentifier?: string): Promise<void> => {
    return PlayerModule.setSubtitleTrack(
      this.nativeId,
      trackIdentifier ?? null
    );
  };

  /**
   * Dynamically schedules the {@link AdItem} for playback.
   * Has no effect if there is no active playback session.
   *
   * @param adItem - Ad to be scheduled for playback.
   *
   * @platform iOS, Android
   */
  scheduleAd = (adItem: AdItem) => {
    PlayerModule.scheduleAd(this.nativeId, adItem);
  };

  /**
   * Skips the current ad.
   * Has no effect if the current ad is not skippable or if no ad is being played back.
   *
   * @platform iOS, Android
   */
  skipAd = () => {
    PlayerModule.skipAd(this.nativeId);
  };

  /**
   * @returns `true` while an ad is being played back or when main content playback has been paused for ad playback.
   * @platform iOS, Android
   */
  isAd = async (): Promise<boolean> => {
    return (await PlayerModule.isAd(this.nativeId)) ?? false;
  };

  /**
   * The current time shift of the live stream in seconds. This value is always 0 if the active {@link Source} is not a
   * live stream or no sources are loaded.
   */
  getTimeShift = async (): Promise<number> => {
    return (await PlayerModule.getTimeShift(this.nativeId)) ?? 0;
  };

  /**
   * The limit in seconds for time shifting. This value is either negative or 0 and it is always 0 if the active
   * {@link Source} is not a live stream or no sources are loaded.
   */
  getMaxTimeShift = async (): Promise<number> => {
    return (await PlayerModule.getMaxTimeShift(this.nativeId)) ?? 0;
  };

  /**
   * Sets the upper bitrate boundary for video qualities. All qualities with a bitrate
   * that is higher than this threshold will not be eligible for automatic quality selection.
   *
   * Can be set to `null` for no limitation.
   */
  setMaxSelectableBitrate = (bitrate: number | null) => {
    PlayerModule.setMaxSelectableBitrate(this.nativeId, bitrate || -1);
  };

  /**
   * @returns a {@link Thumbnail} for the specified playback time for the currently active source if available.
   * Supported thumbnail formats are:
   * - `WebVtt` configured via {@link SourceConfig.thumbnailTrack}, on all supported platforms
   * - HLS `Image Media Playlist` in the multivariant playlist, Android-only
   * - DASH `Image Adaptation Set` as specified in DASH-IF IOP, Android-only
   * If a `WebVtt` thumbnail track is provided, any potential in-manifest thumbnails are ignored on Android.
   *
   * @param time - The time in seconds for which to retrieve the thumbnail.
   */
  getThumbnail = async (time: number): Promise<Thumbnail | null> => {
    return PlayerModule.getThumbnail(this.nativeId, time);
  };

  /**
   * Whether casting to a cast-compatible remote device is available. {@link CastAvailableEvent} signals when
   * casting becomes available.
   *
   * @platform iOS, Android
   */
  isCastAvailable = async (): Promise<boolean> => {
    return (await PlayerModule.isCastAvailable(this.nativeId)) ?? false;
  };

  /**
   * Whether video is currently being casted to a remote device and not played locally.
   *
   * @platform iOS, Android
   */
  isCasting = async (): Promise<boolean> => {
    return (await PlayerModule.isCasting(this.nativeId)) ?? false;
  };

  /**
   * Initiates casting the current video to a cast-compatible remote device. The user has to choose to which device it
   * should be sent.
   *
   * @platform iOS, Android
   */
  castVideo = () => {
    PlayerModule.castVideo(this.nativeId);
  };

  /**
   * Stops casting the current video. Has no effect if {@link Player.isCasting} is `false`.
   *
   * @platform iOS, Android
   */
  castStop = () => {
    PlayerModule.castStop(this.nativeId);
  };

  /**
   * Returns the currently selected video quality.
   * @returns The currently selected video quality.
   */
  getVideoQuality = async (): Promise<VideoQuality> => {
    return PlayerModule.getVideoQuality(this.nativeId);
  };

  /**
   * Returns an array containing all available video qualities the player can adapt between.
   * @returns An array containing all available video qualities the player can adapt between.
   */
  getAvailableVideoQualities = async (): Promise<VideoQuality[]> => {
    return PlayerModule.getAvailableVideoQualities(this.nativeId);
  };

  /**
   * Sets the video quality.
   * @platform Android
   *
   * @param qualityId value obtained from {@link VideoQuality}'s `id` property, which can be obtained via `Player.getAvailableVideoQualities()` to select a specific quality. To use automatic quality selection, 'auto' can be passed here.
   */
  setVideoQuality = (qualityId: string) => {
    if (Platform.OS !== 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method setVideoQuality is not available for iOS and tvOS devices. Only Android devices.`
      );
      return;
    }
    PlayerModule.setVideoQuality(this.nativeId, qualityId);
  };

  /**
   * Sets the playback speed of the player. Fast forward, slow motion and reverse playback are supported.
   * @remarks
   * Platform: iOS, tvOS
   *
   * - Slow motion is indicated by values between `0` and `1`.
   * - Fast forward by values greater than `1`.
   * - Slow reverse is used by values between `0` and `-1`, and fast reverse is used by values less than `-1`. iOS and tvOS only.
   * - Negative values are ignored during Casting and on Android.
   * - During reverse playback the playback will continue until the beginning of the active source is
   *   reached. When reaching the beginning of the source, playback will be paused and the playback
   *   speed will be reset to its default value of `1`. No {@link PlaybackFinishedEvent} will be
   *   emitted in this case.
   *
   * @param playbackSpeed - The playback speed to set.
   */
  setPlaybackSpeed = (playbackSpeed: number) => {
    PlayerModule.setPlaybackSpeed(this.nativeId, playbackSpeed);
  };

  /**
   * @see {@link setPlaybackSpeed} for details on which values playback speed can assume.
   * @returns The player's current playback speed.
   */
  getPlaybackSpeed = async (): Promise<number> => {
    return (await PlayerModule.getPlaybackSpeed(this.nativeId)) ?? 0;
  };

  /**
   * Checks the possibility to play the media at specified playback speed.
   * @param playbackSpeed - The playback speed to check.
   * @returns `true` if it's possible to play the media at the specified playback speed, otherwise `false`. On Android it always returns `undefined`.
   * @platform iOS, tvOS
   */
  canPlayAtPlaybackSpeed = async (
    playbackSpeed: number
  ): Promise<boolean | undefined> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method canPlayAtPlaybackSpeed is not available for Android. Only iOS and tvOS devices.`
      );
      return undefined;
    }
    return (
      (await PlayerModule.canPlayAtPlaybackSpeed(
        this.nativeId,
        playbackSpeed
      )) ?? false
    );
  };

  private maybeInitDecoderConfig = () => {
    if (this.config?.playbackConfig?.decoderConfig == null) {
      return;
    }
    if (Platform.OS === 'ios') {
      return;
    }

    this.decoderConfig = new DecoderConfigBridge(
      this.config.playbackConfig.decoderConfig
    );
    this.decoderConfig.initialize();
  };
}
