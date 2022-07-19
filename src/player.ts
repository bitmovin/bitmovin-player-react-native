import { NativeModules, Platform } from 'react-native';
import { SourceConfig, Source } from './source';

const PlayerModule = NativeModules.PlayerModule;

/**
 * Object used to configure a new `Player` instance.
 */
export interface PlayerConfig {
  /**
   * Optionally user-defined string `id` for the native `Player` instances. Used to access a certain native `Player` instance from any point in the source code then call methods/properties on it.
   *
   * When left empty, a random `UUIDv4` is generated for it.
   * @example
   * Accessing or creating the `Player` with `nativeId` equal to `my-player`:
   * ```
   * const player = new Player({ nativeId: 'my-player' })
   * player.play(); // call methods and properties...
   * ```
   */
  nativeId?: string;
  /**
   * Bitmovin license key that can be found in the Bitmovin portal.
   * If a license key is set here, it will be used instead of the license key found in the `Info.plist` and `AndroidManifest.xml`.
   * @example
   * Configuring the player license key from source code:
   * ```
   * const player = new Player({
   *   licenseKey: '\<LICENSE-KEY-CODE\>',
   * });
   * ```
   * @example
   * `licenseKey` can be safely omitted from source code if it has
   * been configured in Info.plist/AndroidManifest.xml.
   * ```
   * const player = new Player(); // omit `licenseKey`
   * player.play(); // call methods and properties...
   * ```
   */
  licenseKey?: string;
  /**
   * Configures playback behavior. A default `PlaybackConfig` is set initially.
   */
  playbackConfig?: PlaybackConfig;
}

/**
 * Optionally PlaybackConfig Object used to configure a new `PlaybackConfig` instance.
 */
export interface PlaybackConfig {
  /**
   * Optionally isAutoplayEnabled: Specifies whether autoplay is enabled.
   *
   * Default is `false`.
   *
   * @example
   * ```
   * const player = new Player({
   *   {
   *     isAutoplayEnabled: true,
   *   }
   * })
   * ```
   */
  isAutoplayEnabled?: boolean;
  /**
   * Optionally isMuted: Specifies if the player should start muted.
   *
   * Default is `false`.
   *
   * @example
   * ```
   * const player = new Player({
   *   {
   *     isMuted: true,
   *   }
   * })
   * ```
   */
  isMuted?: boolean;
  /**
   * Optionally isTimeShiftEnabled: Specifies if time shifting (during live streaming) should be enabled.
   *
   * Default is `true`.
   *
   *  @example
   * ```
   * const player = new Player({
   *   {
   *     isTimeShiftEnabled: false,
   *   }
   * })
   * ```
   */
  isTimeShiftEnabled?: boolean;
  /**
   * Optionally isBackgroundPlaybackEnabled: Specifies if isBackgroundPlaybackEnabled should be enabled.
   *
   * This param only work on iOS.
   *
   * Default is `false`.
   *
   *  @example
   * ```
   * const player = new Player({
   *   {
   *     isBackgroundPlaybackEnabled: true,
   *   }
   * })
   * ```
   */
  isBackgroundPlaybackEnabled?: boolean;
  /**
   * Optionally isPictureInPictureEnabled: Specifies if isPictureInPictureEnabled should be enabled.
   *
   * This param only work on iOS.
   *
   * Default is `false`.
   *
   *  @example
   * ```
   * const player = new Player({
   *   {
   *     isPictureInPictureEnabled: true,
   *   }
   * })
   * ```
   */
  isPictureInPictureEnabled?: boolean;
}

/**
 * Loads, controls and renders audio and video content represented through `Source`s. A player
 * instance can be created via the `usePlayer` hook and will idle until one or more `Source`s are
 * loaded. Once `load` is called, the player becomes active and initiates necessary downloads to
 * start playback of the loaded source(s).
 *
 * Can be attached to `PlayerView` component in order to use Bitmovin's Player Web UI.
 * @see PlayerView
 */
export class Player {
  /**
   * User-defined `nativeId` string or random `UUIDv4` identifying this `Player` in the native side.
   */
  readonly nativeId: string;

  /**
   * Configuration object used to initialize this `Player`.
   */
  readonly config: PlayerConfig | null;

  constructor(config?: PlayerConfig) {
    this.config = config ?? null;
    this.nativeId = config?.nativeId ?? PlayerModule.generateUUIDv4();
    PlayerModule.initWithConfig(this.nativeId, this.config);
  }

  /**
   * Loads a new `Source` into the player.
   */
  load = (source: SourceConfig) => {
    PlayerModule.loadSource(this.nativeId, source);
  };

  /**
   * Unloads all `Source`s from the player.
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
   * Destroys the player and releases all of its allocated resources.
   * The player instance must not be used after calling this method.
   */
  destroy = () => {
    PlayerModule.destroy(this.nativeId);
  };

  /**
   * Sets the player's volume between 0 (silent) and 100 (max volume).
   *
   * @param volume - The volume level to set.
   */
  setVolume = (volume: number) => {
    PlayerModule.setVolume(this.nativeId, volume);
  };

  /**
   * @returns The currently active source or null if no source is active.
   */
  getSource = async (): Promise<Source> => {
    return PlayerModule.source(this.nativeId);
  };

  /**
   * @returns The player's current volume level.
   */
  getVolume = async (): Promise<number> => {
    return PlayerModule.getVolume(this.nativeId);
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
  getCurrentTime = async (mode?: 'relative' | 'absolute'): Promise<number> => {
    return PlayerModule.currentTime(this.nativeId, mode);
  };

  /**
   * @returns The total duration in seconds of the current video or INFINITY if it’s a live stream.
   */
  getDuration = async (): Promise<number> => {
    return PlayerModule.duration(this.nativeId);
  };

  /**
   * @returns `true` if the player is muted.
   */
  isMuted = async (): Promise<boolean> => {
    return PlayerModule.isMuted(this.nativeId);
  };

  /**
   * @returns `true` if the player is currently playing, i.e. has started and is not paused.
   */
  isPlaying = async (): Promise<boolean> => {
    return PlayerModule.isPlaying(this.nativeId);
  };

  /**
   * @returns `true` if the player has started playback but it's currently paused.
   */
  isPaused = async (): Promise<boolean> => {
    return PlayerModule.isPaused(this.nativeId);
  };

  /**
   * @returns `true` if the displayed video is a live stream.
   */
  isLive = async (): Promise<boolean> => {
    return PlayerModule.isLive(this.nativeId);
  };

  /**
   * @remarks Only available for iOS devices.
   * @returns `true` when media is played externally using AirPlay.
   */
  isAirPlayActive = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method isAirPlayActive is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return PlayerModule.isAirPlayActive(this.nativeId);
  };

  /**
   * @remarks Only available for iOS devices.
   * @returns `true` when AirPlay is available.
   */
  isAirPlayAvailable = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.nativeId}] Method isAirPlayAvailable is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return PlayerModule.isAirPlayAvailable(this.nativeId);
  };
}
