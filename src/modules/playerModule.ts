import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import type { NativeSource } from './sourceModule';
import type { NativeOffline } from '../offline/offlineModule';
import type { OfflineSourceOptions } from '../offline';
import type { BufferLevels } from '../bufferApi';
import type { NativeCallback } from '../native/nativeCallbacks';
import { requireNativeModule } from 'expo-modules-core';
import type { AdBreak, AdItem, ImaSettings } from '../advertising';
import type { NativeEventPayload } from '../utils/eventListeners';

export type PlayerModuleEvents = {
  onShouldLoadAdItem: ({
    nativeId,
    id,
    adItem,
  }: {
    nativeId: string;
    id: number;
    adItem: AdItem;
  }) => void;
  onShouldPlayAdBreak: ({
    nativeId,
    id,
    adBreak,
  }: {
    nativeId: string;
    id: number;
    adBreak: AdBreak;
  }) => void;
  onImaBeforeInitialization: ({
    nativeId,
    id,
    settings,
  }: {
    nativeId: string;
    id: number;
    settings: ImaSettings;
  }) => void;
  onPlayerEvent: (payload: NativeEventPayload) => void;
};

/** @internal Shared handle used by migrated Player APIs. */
export interface NativePlayer extends SharedObject {
  getPlaylistSourceIds(): Promise<string[]>;
  playlistAdd(source: NativeSource, index?: number): Promise<void>;
  playlistRemove(source: NativeSource): Promise<void>;
  playlistRemoveAt(index: number): Promise<void>;
  playlistSeek(source: NativeSource, time: number): Promise<void>;
  play(): Promise<void>;

  pause(): Promise<void>;

  mute(): Promise<void>;

  unmute(): Promise<void>;

  seek(time: number): Promise<void>;

  timeShift(offset: number): Promise<void>;

  setVolume(volume: number): Promise<void>;

  getVolume(): Promise<number | null>;

  currentTime(mode?: string): Promise<number | null>;

  isPlaying(): Promise<boolean | null>;

  isPaused(): Promise<boolean | null>;

  duration(): Promise<number | null>;

  isMuted(): Promise<boolean | null>;

  unload(): Promise<void>;

  getTimeShift(): Promise<number | null>;

  isLive(): Promise<boolean | null>;

  getMaxTimeShift(): Promise<number | null>;

  getPlaybackSpeed(): Promise<number | null>;

  setPlaybackSpeed(playbackSpeed: number): Promise<void>;

  isAd(): Promise<boolean | null>;

  setMaxSelectableBitrate(maxBitrate: number): Promise<void>;

  isAirPlayActive(): Promise<boolean | null>;

  isAirPlayAvailable(): Promise<boolean | null>;

  showAirPlayTargetPicker(): Promise<void>;

  isCastAvailable(): Promise<boolean | null>;

  isCasting(): Promise<boolean | null>;

  castVideo(): Promise<void>;

  castStop(): Promise<void>;

  skipAd(): Promise<void>;

  canPlayAtPlaybackSpeed(playbackSpeed: number): Promise<boolean | null>;

  getAudioTrack(): Promise<any | null>;

  getAvailableAudioTracks(): Promise<any[]>;

  setAudioTrack(trackId: string): Promise<void>;

  getSubtitleTrack(): Promise<any | null>;

  getAvailableSubtitles(): Promise<any[]>;

  setSubtitleTrack(trackId: string | null): Promise<void>;

  scheduleAd(adConfig: Record<string, any>): Promise<void>;

  getThumbnail(time: number): Promise<any | null>;

  getVideoQuality(): Promise<any | null>;

  getAvailableVideoQualities(): Promise<any[]>;

  setVideoQuality(qualityId: string): Promise<void>;
  loadOfflineContent(
    offline: NativeOffline,
    options?: OfflineSourceOptions
  ): Promise<boolean>;
  isMediaControlsEnabled(): Promise<boolean | null>;
  setMediaControlsEnabled(enabled: boolean): Promise<void>;
  sendCustomDataEvent(customData: Record<string, any>): Promise<void>;
  getAnalyticsUserId(): Promise<string | null>;
  getBufferLevel(type: string): Promise<BufferLevels | null>;
  setBufferTargetLevel(type: string, value: number): Promise<void>;
}

declare class PlayerModule extends NativeModule<PlayerModuleEvents> {
  /** @internal */
  getSharedPlayer(nativeId: string): Promise<NativePlayer>;

  /**
   * Whether the native app was built with Google IMA.
   */
  readonly isGoogleImaEnabled: boolean;

  /**
   * Attaches a native listener for `eventName` to nativeId's player.
   */
  on(nativeId: string, eventName: string): Promise<void>;

  /**
   * Detaches the native listener for `eventName` from nativeId's player.
   */
  off(nativeId: string, eventName: string): Promise<void>;

  /**
   * Call .destroy() on nativeId's player and remove from registry.
   * Releases the sources of the current playback session.
   */
  destroy(nativeId: string): Promise<void>;

  /**
   * Applies the JS decision for an ad item load callback.
   */
  setShouldLoadAdItem(id: number, shouldLoad: boolean): Promise<void>;

  /**
   * Applies the JS decision for an ad break playback callback.
   */
  setShouldPlayAdBreak(id: number, shouldPlay: boolean): Promise<void>;

  /**
   * Applies the JS-updated IMA settings for a before-initialization callback.
   */
  setPreparedImaSettings(id: number, settings: ImaSettings): Promise<void>;

  /**
   * Creates a new Player instance using the provided config.
   */
  initializeWithConfig(
    nativeId: string,
    config?: Record<string, any>,
    callback?: NativeCallback
  ): Promise<NativePlayer>;

  /**
   * Creates a new analytics-enabled Player instance.
   */
  initializeWithAnalyticsConfig(
    nativeId: string,
    analyticsConfig: Record<string, any>,
    config?: Record<string, any>,
    callback?: NativeCallback
  ): Promise<NativePlayer>;

  /**
   * Load source into the player.
   * Requires SourceModule dependency.
   */
  loadSource(nativeId: string, sourceNativeId: string): Promise<void>;

  /**
   * Load a playlist into the player.
   * Requires SourceModule dependency.
   */
  loadPlaylist(
    nativeId: string,
    sourceNativeIds: string[],
    options?: Record<string, any>
  ): Promise<void>;

  /**
   * Get the native id of the active source.
   */
  source(nativeId: string): Promise<string | null>;
}

export default requireNativeModule<PlayerModule>('PlayerModule');
