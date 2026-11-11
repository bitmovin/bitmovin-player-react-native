import type { NativeOffline } from './offline/offlineModule';
import type { EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';
import PlayerModule, { type NativePlayer } from './modules/playerModule';
import NativeInstance from './nativeInstance';
import type { SourceConfig } from './source';
import { Source } from './source';
import type { AudioTrack } from './audioTrack';
import type { SubtitleTrack } from './subtitleTrack';
import type { OfflineContentManager, OfflineSourceOptions } from './offline';
import type { Thumbnail } from './thumbnail';
import { AnalyticsApi } from './analytics/analyticsApi';
import type { PlayerConfig } from './playerConfig';
import type { AdBreak, AdItem, ImaSettings } from './advertising';
import { BufferApi } from './bufferApi';
import { MediaControlsApi } from './mediaControlsApi';
import type { VideoQuality } from './media';
import type { PlaylistConfig } from './playlist';
import { PlaylistApi } from './playlist';
import { validatePlaylistConfig } from './playlist/validatePlaylistConfig';
import type { PlayerEventMap } from './eventMap';
import { EventListeners } from './utils/eventListeners';
import { SourceRegistry } from './utils/sourceRegistry';
import { NativeConfigSerializer } from './native/nativeConfigSerializer';

/**
 * Loads, controls and renders audio and video content represented through {@link Source}s. A player
 * instance can be created via the {@link usePlayer} hook and will idle until one or more {@link Source}s are
 * loaded. Once {@link Player.load} or {@link Player.loadSource} is called, the player becomes active and initiates necessary downloads to
 * start playback of the loaded source(s).
 *
 * Can be attached to {@link PlayerView} component in order to use Bitmovin's Player Web UI.
 * @see PlayerView
 * Command promises acknowledge the native operation. Observe playback events such as
 * `Ready` or `Playing` when waiting for playback readiness.
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
   * The `AnalyticsApi` for interactions regarding the `Player`'s analytics.
   *
   * `undefined` if the player was created without analytics support.
   */
  analytics?: AnalyticsApi = undefined;
  /**
   * The {@link BufferApi} for interactions regarding the buffer.
   */
  buffer: BufferApi = new BufferApi(() => this.native);
  /**
   * The {@link MediaControlsApi} for interactions regarding the Player's media controls integration.
   *
   * @platform iOS, tvOS
   */
  mediaControls: MediaControlsApi = new MediaControlsApi(() => this.native);
  /**
   * The {@link PlaylistApi} for interactions regarding the playlist of the playback session.
   */
  playlist: PlaylistApi = new PlaylistApi(() => this.native);

  private onShouldLoadAdItemSubscription?: EventSubscription;
  private onShouldPlayAdBreakSubscription?: EventSubscription;
  private onImaBeforeInitializationSubscription?: EventSubscription;
  private initialization?: Promise<void>;
  private destruction?: Promise<void>;
  private sharedPlayer?: Promise<NativePlayer>;
  private static readonly loadedOffline = new WeakMap<
    NativePlayer,
    NativeOffline
  >();

  private clearLoadedOffline = async (): Promise<void> => {
    const native = await this.sharedPlayer?.catch(() => undefined);
    if (native) Player.loadedOffline.delete(native);
  };

  /** @internal */
  get native(): Promise<NativePlayer> {
    return (this.sharedPlayer ??= this.initialize().then(() =>
      PlayerModule.getSharedPlayer(this.nativeId)
    ));
  }

  private readonly eventListeners = new EventListeners<PlayerEventMap>(
    this.nativeId,
    PlayerModule,
    (listener) => PlayerModule.addListener('onPlayerEvent', listener)
  );
  /**
   * Allocates the native `Player` instance and its resources natively.
   * Calls made while an initialization is in progress share it.
   */
  initialize = (): Promise<void> => {
    this.initialization ??= this.initializeNative().finally(() => {
      this.initialization = undefined;
    });
    return this.initialization;
  };

  private initializeNative = async (): Promise<void> => {
    if (!this.isInitialized) {
      this.ensureShouldLoadAdItemListener();
      this.ensureShouldPlayAdBreakListener();
      this.ensureImaBeforeInitializationListener();
      const analyticsConfig = this.config?.analyticsConfig;
      const serializer = new NativeConfigSerializer();
      const config = { ...this.config };
      if (this.config?.networkConfig) {
        config.networkConfig = serializer.serialize(this.config.networkConfig);
      }
      if (this.config?.playbackConfig?.decoderConfig) {
        config.playbackConfig = {
          ...this.config.playbackConfig,
          decoderConfig: serializer.serialize(
            this.config.playbackConfig.decoderConfig
          ),
        };
      }

      const native = await serializer.dispatcher.createAsync((callback) =>
        analyticsConfig
          ? PlayerModule.initializeWithAnalyticsConfig(
              this.nativeId,
              analyticsConfig,
              config,
              callback
            )
          : PlayerModule.initializeWithConfig(this.nativeId, config, callback)
      );
      // Every initialized alias keeps the canonical peer and its configuration callbacks alive.
      this.sharedPlayer = Promise.resolve(native);
      if (analyticsConfig) this.analytics = new AnalyticsApi(() => this.native);

      this.isInitialized = true;
      this.eventListeners.attachNative();
    }
    return Promise.resolve();
  };

  /**
   * Destroys the native `Player` and releases all of its allocated resources.
   *
   * The {@link Source}s of the current playback session are released as well, and can be loaded again, e.g. into
   * another player.
   */
  destroy = (): Promise<void> => {
    return (this.destruction ??= this.destroyNative());
  };

  private destroyNative = async (): Promise<void> => {
    if (!this.isDestroyed) {
      // Finish an already-started creation before releasing it; never create just for cleanup.
      await this.initialization?.catch(() => {});
      // Remove the listeners only after the native destroy, so they still receive the `destroy` event.
      const destruction = PlayerModule.destroy(this.nativeId).finally(
        async () => {
          await this.clearLoadedOffline();
          this.eventListeners.removeAll();
        }
      );
      this.onShouldLoadAdItemSubscription?.remove();
      this.onShouldPlayAdBreakSubscription?.remove();
      this.onImaBeforeInitializationSubscription?.remove();
      this.onShouldLoadAdItemSubscription = undefined;
      this.onShouldPlayAdBreakSubscription = undefined;
      this.onImaBeforeInitializationSubscription = undefined;
      this.isDestroyed = true;
      await destruction;
    }
  };

  private ensureShouldLoadAdItemListener = () => {
    const callback = this.config?.advertisingConfig?.shouldLoadAdItem;
    if (!callback) {
      return;
    }
    if (this.onShouldLoadAdItemSubscription) {
      return;
    }
    this.onShouldLoadAdItemSubscription = PlayerModule.addListener(
      'onShouldLoadAdItem',
      ({ nativeId, id, adItem }) => {
        if (nativeId !== this.nativeId) {
          return;
        }
        const cloned: AdItem = {
          ...adItem,
          sources: adItem.sources.map((source) => ({ ...source })),
        };
        let shouldLoad = true;
        try {
          const shouldLoadResult = callback(cloned);
          shouldLoad =
            typeof shouldLoadResult === 'boolean' ? shouldLoadResult : true;
        } catch {
          shouldLoad = true;
        }
        void PlayerModule.setShouldLoadAdItem(id, shouldLoad);
      }
    );
  };

  /**
   * Loads a new {@link Source} from `sourceConfig` into the player.
   */
  load = async (sourceConfig: SourceConfig) => {
    return this.loadSource(new Source(sourceConfig));
  };

  /**
   * Loads the downloaded content from {@link OfflineContentManager} into the player.
   */
  loadOfflineContent = async (
    offlineContentManager: OfflineContentManager,
    options?: OfflineSourceOptions
  ): Promise<void> => {
    const [native, offline] = await Promise.all([
      this.native,
      offlineContentManager.native,
    ]);
    if (await native.loadOfflineContent(offline, options)) {
      Player.loadedOffline.set(native, offline);
    }
  };

  /**
   * Loads the given {@link Source} into the player.
   */
  loadSource = async (source: Source) => {
    await this.native;
    return source
      .initialize()
      .then(() => PlayerModule.loadSource(this.nativeId, source.nativeId))
      .then(this.clearLoadedOffline);
  };

  /**
   * Gets the currently active {@link Source} of the playback session.
   *
   * @returns the active source, or `undefined` if there is no active playback session or the active source was
   * not created through a {@link Source} instance (e.g. offline content).
   */
  getSource = async (): Promise<Source | undefined> => {
    const sourceNativeId = await PlayerModule.source(this.nativeId);
    return sourceNativeId ? SourceRegistry.get(sourceNativeId) : undefined;
  };

  /**
   * Starts a new playback session consisting of {@link PlaylistConfig.sources}.
   * The first source becomes active immediately. An already active playback session is unloaded first.
   *
   * Only one source is active at a time and all player APIs (e.g. time, duration, seeking) act on the active
   * source; there is no playlist-wide time. Source events of inactive sources, such as `SourceLoaded` of a
   * preloaded source, are not emitted by the player; use {@link Source.on} to receive them. Only `sourceError`
   * is also emitted for inactive sources, without identifying the source. Ads scheduled
   * via the advertising config only apply to the first source.
   *
   * On iOS and tvOS, only HLS, progressive and `movpkg` sources can be part of a playlist.
   *
   * Throws if `sources` is empty or contains a source more than once, `options.replayMode` is unknown, or (on
   * iOS and tvOS) a source has an unsupported type.
   */
  loadPlaylist = async (playlistConfig: PlaylistConfig) => {
    validatePlaylistConfig(playlistConfig);
    await this.native;
    return Promise.all(
      playlistConfig.sources.map((source) => source.initialize())
    )
      .then(() =>
        PlayerModule.loadPlaylist(
          this.nativeId,
          playlistConfig.sources.map((source) => source.nativeId),
          playlistConfig.options
        )
      )
      .then(this.clearLoadedOffline);
  };

  /**
   * Registers `listener` to be called whenever the player emits `eventName`, independent of any
   * {@link PlayerView}. The player emits its own events and the source events of the active source only,
   * except `sourceError`, which it also emits for inactive sources without identifying the source;
   * use {@link Source.on} for events of a specific source, including while it is inactive.
   *
   * Listeners registered before the player is initialized are attached during {@link Player.initialize},
   * and listeners registered before loading receive the events of that load, such as `playerActive`.
   * All listeners are removed when the player is destroyed. Calling it on a destroyed player has no effect
   * and logs a warning.
   * Registering the same `listener` again for `eventName` has no effect; use {@link Player.off} to remove it.
   *
   * @param eventName - The name of the event, e.g. `playerActive`.
   * @param listener - The function called with the event.
   */
  on = <K extends keyof PlayerEventMap>(
    eventName: K,
    listener: (event: PlayerEventMap[K]) => void
  ): void => {
    if (this.isDestroyed) {
      console.warn(
        `[Player ${this.nativeId}] The player was destroyed and must not be used any more, therefore on has no effect.`
      );
      return;
    }
    this.eventListeners.on(eventName, listener);
  };

  /**
   * Removes a `listener` previously registered for `eventName` via {@link Player.on}.
   * Has no effect if the listener is not registered.
   *
   * @param eventName - The name of the event.
   * @param listener - The function passed to {@link Player.on}.
   */
  off = <K extends keyof PlayerEventMap>(
    eventName: K,
    listener: (event: PlayerEventMap[K]) => void
  ): void => {
    this.eventListeners.off(eventName, listener);
  };

  /**
   * Unloads all {@link Source}s from the player.
   */
  unload = async () => {
    return this.native
      .then((native) => native.unload())
      .then(this.clearLoadedOffline);
  };

  /**
   * Starts or resumes playback after being paused. Has no effect if the player is already playing.
   */
  play = async () => {
    return this.native.then((native) => native.play());
  };

  /**
   * Pauses the video if it is playing. Has no effect if the player is already paused.
   */
  pause = async () => {
    return this.native.then((native) => native.pause());
  };

  /**
   * Seeks to the given playback time specified by the parameter `time` in seconds. Must not be
   * greater than the total duration of the video. Has no effect when watching a live stream since
   * seeking is not possible.
   *
   * @param time - The time to seek to in seconds.
   */
  seek = async (time: number) => {
    return this.native.then((native) => native.seek(time));
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
  timeShift = async (offset: number) => {
    return this.native.then((native) => native.timeShift(offset));
  };

  /**
   * Mutes the player if an audio track is available. Has no effect if the player is already muted.
   */
  mute = async () => {
    return this.native.then((native) => native.mute());
  };

  /**
   * Unmutes the player if it is muted. Has no effect if the player is already unmuted.
   */
  unmute = async () => {
    return this.native.then((native) => native.unmute());
  };

  /**
   * Sets the player's volume between 0 (silent) and 100 (max volume).
   *
   * @param volume - The volume level to set.
   */
  setVolume = async (volume: number) => {
    return this.native.then((native) => native.setVolume(volume));
  };

  private ensureShouldPlayAdBreakListener = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    const callback = this.config?.advertisingConfig?.shouldPlayAdBreak;
    if (!callback) {
      return;
    }
    if (this.onShouldPlayAdBreakSubscription) {
      return;
    }
    this.onShouldPlayAdBreakSubscription = PlayerModule.addListener(
      'onShouldPlayAdBreak',
      ({ nativeId, id, adBreak }) => {
        if (nativeId !== this.nativeId) {
          return;
        }
        const cloned: AdBreak = {
          ...adBreak,
          ads: adBreak.ads.map((ad) => ({
            ...ad,
            data: ad.data ? { ...ad.data } : undefined,
          })),
        };
        let shouldPlay = true;
        try {
          const shouldPlayResult = callback(cloned);
          shouldPlay =
            typeof shouldPlayResult === 'boolean' ? shouldPlayResult : true;
        } catch {
          shouldPlay = true;
        }
        void PlayerModule.setShouldPlayAdBreak(id, shouldPlay);
      }
    );
  };

  private ensureImaBeforeInitializationListener = () => {
    const callback = this.config?.advertisingConfig?.ima?.beforeInitialization;
    if (!callback) {
      return;
    }
    if (!PlayerModule.isGoogleImaEnabled) {
      console.warn(
        'advertisingConfig.ima.beforeInitialization is ignored because Google IMA is disabled. ' +
          'Set features.googleIMA to true in the Bitmovin config plugin and rebuild the native app. ' +
          'See the "Google IMA" section of the bitmovin-player-react-native README.'
      );
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
        void PlayerModule.setPreparedImaSettings(id, prepared);
      }
    );
  };

  /**
   * @returns The player's current volume level.
   */
  getVolume = async (): Promise<number> => {
    return (await (await this.native).getVolume()) ?? 0;
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
    return (await (await this.native).currentTime(mode)) ?? 0;
  };

  /**
   * @returns The total duration in seconds of the current video or INFINITY if it’s a live stream.
   */
  getDuration = async (): Promise<number> => {
    return (await (await this.native).duration()) ?? 0;
  };

  /**
   * @returns `true` if the player is muted.
   */
  isMuted = async (): Promise<boolean> => {
    return (await (await this.native).isMuted()) ?? false;
  };

  /**
   * @returns `true` if the player is currently playing, i.e. has started and is not paused.
   */
  isPlaying = async (): Promise<boolean> => {
    return (await (await this.native).isPlaying()) ?? false;
  };

  /**
   * @returns `true` if the player has started playback but it's currently paused.
   */
  isPaused = async (): Promise<boolean> => {
    return (await (await this.native).isPaused()) ?? false;
  };

  /**
   * @returns `true` if the displayed video is a live stream.
   */
  isLive = async (): Promise<boolean> => {
    return (await (await this.native).isLive()) ?? false;
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
    return (await (await this.native).isAirPlayActive()) ?? false;
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
    return (await (await this.native).isAirPlayAvailable()) ?? false;
  };

  /**
   * Displays the system AirPlay route selection menu, allowing the user to pick
   * an AirPlay target for the current playback.
   *
   * @platform iOS
   */
  showAirPlayTargetPicker = async () => {
    if (Platform.OS !== 'ios' || Platform.isTV) {
      console.warn(
        `[Player ${this.nativeId}] Method showAirPlayTargetPicker is only available on iOS (not Android/tvOS).`
      );
      return;
    }
    return this.native.then((native) => native.showAirPlayTargetPicker());
  };

  /**
   * @returns The currently selected audio track or `null`.
   */
  getAudioTrack = async (): Promise<AudioTrack | null> => {
    return (await this.native).getAudioTrack();
  };

  /**
   * @returns An array containing {@link AudioTrack} objects for all available audio tracks.
   */
  getAvailableAudioTracks = async (): Promise<AudioTrack[]> => {
    return (await this.native).getAvailableAudioTracks();
  };

  /**
   * Sets the audio track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableAudioTracks.
   *
   * @param trackIdentifier - The {@link AudioTrack.identifier} to be set.
   */
  setAudioTrack = async (trackIdentifier: string): Promise<void> => {
    return (await this.native).setAudioTrack(trackIdentifier);
  };

  /**
   * @returns The currently selected {@link SubtitleTrack} or `null`.
   */
  getSubtitleTrack = async (): Promise<SubtitleTrack | null> => {
    return (await this.native).getSubtitleTrack();
  };

  /**
   * @returns An array containing SubtitleTrack objects for all available subtitle tracks.
   */
  getAvailableSubtitles = async (): Promise<SubtitleTrack[]> => {
    return (await this.native).getAvailableSubtitles();
  };

  /**
   * Sets the subtitle track to the ID specified by trackIdentifier. A list can be retrieved by calling getAvailableSubtitles.
   * Pass `undefined` to disable subtitles.
   *
   * @param trackIdentifier - The {@link SubtitleTrack.identifier} to be set.
   */
  setSubtitleTrack = async (
    trackIdentifier: string | undefined
  ): Promise<void> => {
    return (await this.native).setSubtitleTrack(trackIdentifier ?? null);
  };

  /**
   * Dynamically schedules the {@link AdItem} for playback.
   * Has no effect if there is no active playback session.
   *
   * @param adItem - Ad to be scheduled for playback.
   *
   * @platform iOS, Android
   */
  scheduleAd = async (adItem: AdItem) => {
    return this.native.then((native) => native.scheduleAd(adItem));
  };

  /**
   * Skips the current ad.
   * Has no effect if the current ad is not skippable or if no ad is being played back.
   *
   * Also dismisses a visible pause ad. The main content stays paused.
   *
   * @platform iOS, Android
   */
  skipAd = async () => {
    return this.native.then((native) => native.skipAd());
  };

  /**
   * @returns `true` while an ad is being played back or when main content playback has been paused for ad playback.
   * `false` while a pause ad is shown.
   *
   * @platform iOS, Android
   */
  isAd = async (): Promise<boolean> => {
    return (await (await this.native).isAd()) ?? false;
  };

  /**
   * The current time shift of the live stream in seconds. This value is always 0 if the active {@link Source} is not a
   * live stream or no sources are loaded.
   */
  getTimeShift = async (): Promise<number> => {
    return (await (await this.native).getTimeShift()) ?? 0;
  };

  /**
   * The limit in seconds for time shifting. This value is either negative or 0 and it is always 0 if the active
   * {@link Source} is not a live stream or no sources are loaded.
   */
  getMaxTimeShift = async (): Promise<number> => {
    return (await (await this.native).getMaxTimeShift()) ?? 0;
  };

  /**
   * Sets the upper bitrate boundary for video qualities. All qualities with a bitrate
   * that is higher than this threshold will not be eligible for automatic quality selection.
   *
   * Can be set to `null` for no limitation.
   */
  setMaxSelectableBitrate = async (bitrate: number | null) => {
    return this.native.then((native) =>
      native.setMaxSelectableBitrate(bitrate || -1)
    );
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
    return (await this.native).getThumbnail(time);
  };

  /**
   * Whether casting to a cast-compatible remote device is available. {@link CastAvailableEvent} signals when
   * casting becomes available.
   *
   * @platform iOS, Android
   */
  isCastAvailable = async (): Promise<boolean> => {
    return (await (await this.native).isCastAvailable()) ?? false;
  };

  /**
   * Whether video is currently being casted to a remote device and not played locally.
   *
   * @platform iOS, Android
   */
  isCasting = async (): Promise<boolean> => {
    return (await (await this.native).isCasting()) ?? false;
  };

  /**
   * Initiates casting the current video to a cast-compatible remote device. The user has to choose to which device it
   * should be sent.
   *
   * @platform iOS, Android
   */
  castVideo = async () => {
    return this.native.then((native) => native.castVideo());
  };

  /**
   * Stops casting the current video. Has no effect if {@link Player.isCasting} is `false`.
   *
   * @platform iOS, Android
   */
  castStop = async () => {
    return this.native.then((native) => native.castStop());
  };

  /**
   * Returns the currently selected video quality.
   * @returns The currently selected video quality.
   */
  getVideoQuality = async (): Promise<VideoQuality> => {
    return (await this.native).getVideoQuality();
  };

  /**
   * Returns an array containing all available video qualities the player can adapt between.
   * @returns An array containing all available video qualities the player can adapt between.
   */
  getAvailableVideoQualities = async (): Promise<VideoQuality[]> => {
    return (await this.native).getAvailableVideoQualities();
  };

  /**
   * Sets the video quality.
   * @platform Android
   *
   * @param qualityId value obtained from {@link VideoQuality}'s `id` property, which can be obtained via `Player.getAvailableVideoQualities()` to select a specific quality. To use automatic quality selection, 'auto' can be passed here.
   */
  setVideoQuality = async (qualityId: string) => {
    if (Platform.OS !== 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method setVideoQuality is not available for iOS and tvOS devices. Only Android devices.`
      );
      return;
    }
    return this.native.then((native) => native.setVideoQuality(qualityId));
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
  setPlaybackSpeed = async (playbackSpeed: number) => {
    return this.native.then((native) => native.setPlaybackSpeed(playbackSpeed));
  };

  /**
   * @see {@link setPlaybackSpeed} for details on which values playback speed can assume.
   * @returns The player's current playback speed.
   */
  getPlaybackSpeed = async (): Promise<number> => {
    return (await (await this.native).getPlaybackSpeed()) ?? 0;
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
      (await (await this.native).canPlayAtPlaybackSpeed(playbackSpeed)) ?? false
    );
  };
}
