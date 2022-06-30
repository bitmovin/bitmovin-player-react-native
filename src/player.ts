import { NativeModules, Platform } from 'react-native';
import { SourceConfig, Source } from './source';

const PlayerModule = NativeModules.PlayerModule;

/**
 * Object used to configure a new `Player` instance.
 */
export interface PlayerConfig {
  /**
   * Optional user defined id that identifies a `Player` instances on the native side.
   * Access a certain `Player` instance and call methods on it using this property.
   *
   * In case it's left empty, a random uuidv4 will be generated for it.
   */
  nativeId?: string;
  /**
   * Bitmovin license key that can be found in the Bitmovin portal.
   * If a license key is set here, it will be used instead of the license key found
   * in the `Info.plist` and `AndroidManifest.xml`.
   */
  licenseKey?: string;
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
   * User defined id or random uuidv4 that identifies this `Player`.
   */
  id: string;

  /**
   * Configuration object used to initialize this `Player`.
   */
  config: PlayerConfig;

  constructor(config: PlayerConfig) {
    this.config = config;
    // this.id = config.nativeId ?? uuidv4();
    this.id = config.nativeId ?? PlayerModule.generateUUIDv4();
    PlayerModule.initWithConfig(this.id, config);
  }

  /**
   * Loads a new `Source` into the player.
   */
  load = (source: SourceConfig) => {
    PlayerModule.loadSource(this.id, source);
  };

  /**
   * Unloads all `Source`s in the player.
   */
  unload = () => {
    PlayerModule.unload(this.id);
  };

  /**
   * Starts or resumes playback after being paused. Has no effect if the player is already playing.
   */
  play = () => {
    PlayerModule.play(this.id);
  };

  /**
   * Pauses the video if it is playing. Has no effect if the player is already paused.
   */
  pause = () => {
    PlayerModule.pause(this.id);
  };

  /**
   * Seeks to the given playback time specified by the parameter `time` in seconds. Must not be
   * greater than the total duration of the video. Has no effect when watching a live stream since
   * seeking is not possible.
   *
   * @param time - The time to seek to in seconds.
   */
  seek = (time: number) => {
    PlayerModule.seek(this.id, time);
  };

  /**
   * Mutes the player if an audio track is available. Has no effect if the player is already muted.
   */
  mute = () => {
    PlayerModule.mute(this.id);
  };

  /**
   * Unmutes the player if it is muted. Has no effect if the player is already unmuted.
   */
  unmute = () => {
    PlayerModule.unmute(this.id);
  };

  /**
   * Destroys the player and releases all of its allocated resources.
   * The player instance must not be used after calling this method.
   */
  destroy = () => {
    PlayerModule.destroy(this.id);
  };

  /**
   * Sets the player's volume between 0 (silent) and 100 (max volume).
   *
   * @param volume - The volume level to set.
   */
  setVolume = (volume: number) => {
    PlayerModule.setVolume(this.id, volume);
  };

  /**
   * @returns The currently active source or null if no source is active.
   */
  getSource = async (): Promise<Source> => {
    return PlayerModule.source(this.id);
  };

  /**
   * @returns The player's current volume level.
   */
  getVolume = async (): Promise<number> => {
    return PlayerModule.getVolume(this.id);
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
    return PlayerModule.currentTime(this.id, mode);
  };

  /**
   * @returns The total duration in seconds of the current video or INFINITY if it’s a live stream.
   */
  getDuration = async (): Promise<number> => {
    return PlayerModule.duration(this.id);
  };

  /**
   * @returns `true` if the player is muted.
   */
  isMuted = async (): Promise<boolean> => {
    return PlayerModule.isMuted(this.id);
  };

  /**
   * @returns `true` if the player is currently playing, i.e. has started and is not paused.
   */
  isPlaying = async (): Promise<boolean> => {
    return PlayerModule.isPlaying(this.id);
  };

  /**
   * @returns `true` if the player has started playback but it's currently paused.
   */
  isPaused = async (): Promise<boolean> => {
    return PlayerModule.isPaused(this.id);
  };

  /**
   * @returns `true` if the displayed video is a live stream.
   */
  isLive = async (): Promise<boolean> => {
    return PlayerModule.isLive(this.id);
  };

  /**
   * @remarks Only available for iOS devices.
   * @returns `true` when media is played externally using AirPlay.
   */
  isAirPlayActive = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.id}] Method isAirPlayActive is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return PlayerModule.isAirPlayActive(this.id);
  };

  /**
   * @remarks Only available for iOS devices.
   * @returns `true` when AirPlay is available.
   */
  isAirPlayAvailable = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.id}] Method isAirPlayAvailable is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return PlayerModule.isAirPlayAvailable(this.id);
  };
}
