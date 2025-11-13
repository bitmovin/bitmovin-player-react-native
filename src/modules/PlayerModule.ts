import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { ImaSettings } from '../advertising';

export type PlayerModuleEvents = {
  onImaBeforeInitialization: ({
    nativeId,
    id,
    settings,
  }: {
    nativeId: string;
    id: number;
    settings: ImaSettings;
  }) => void;
};

declare class PlayerModule extends NativeModule<PlayerModuleEvents> {
  /**
   * Call .play() on nativeId's player.
   */
  play(nativeId: string): Promise<void>;

  /**
   * Call .pause() on nativeId's player.
   */
  pause(nativeId: string): Promise<void>;

  /**
   * Call .mute() on nativeId's player.
   */
  mute(nativeId: string): Promise<void>;

  /**
   * Call .unmute() on nativeId's player.
   */
  unmute(nativeId: string): Promise<void>;

  /**
   * Call .seek(time) on nativeId's player.
   */
  seek(nativeId: string, time: number): Promise<void>;

  /**
   * Sets timeShift on nativeId's player.
   */
  timeShift(nativeId: string, offset: number): Promise<void>;

  /**
   * Call .destroy() on nativeId's player and remove from registry.
   */
  destroy(nativeId: string): Promise<void>;

  /**
   * Call .setVolume(volume) on nativeId's player.
   */
  setVolume(nativeId: string, volume: number): Promise<void>;

  /**
   * Resolve nativeId's current volume.
   */
  getVolume(nativeId: string): Promise<number | null>;

  /**
   * Resolve nativeId's current time.
   */
  currentTime(nativeId: string, mode?: string): Promise<number | null>;

  /**
   * Resolve nativeId's current playing state.
   */
  isPlaying(nativeId: string): Promise<boolean | null>;

  /**
   * Resolve nativeId's current paused state.
   */
  isPaused(nativeId: string): Promise<boolean | null>;

  /**
   * Resolve nativeId's active source duration.
   */
  duration(nativeId: string): Promise<number | null>;

  /**
   * Resolve nativeId's current muted state.
   */
  isMuted(nativeId: string): Promise<boolean | null>;

  /**
   * Call .unload() on nativeId's player.
   */
  unload(nativeId: string): Promise<void>;

  /**
   * Resolve nativeId's current time shift value.
   */
  getTimeShift(nativeId: string): Promise<number | null>;

  /**
   * Resolve nativeId's live stream state.
   */
  isLive(nativeId: string): Promise<boolean | null>;

  /**
   * Resolve nativeId's maximum time shift value.
   */
  getMaxTimeShift(nativeId: string): Promise<number | null>;

  /**
   * Resolve nativeId's current playback speed.
   */
  getPlaybackSpeed(nativeId: string): Promise<number | null>;

  /**
   * Set playback speed for nativeId's player.
   */
  setPlaybackSpeed(nativeId: string, playbackSpeed: number): Promise<void>;

  /**
   * Resolve nativeId's current ad state.
   */
  isAd(nativeId: string): Promise<boolean | null>;

  /**
   * Set maximum selectable bitrate for nativeId's player.
   */
  setMaxSelectableBitrate(nativeId: string, maxBitrate: number): Promise<void>;

  /**
   * Resolve nativeId's AirPlay activation state (iOS only).
   */
  isAirPlayActive(nativeId: string): Promise<boolean | null>;

  /**
   * Resolve nativeId's AirPlay availability state (iOS only).
   */
  isAirPlayAvailable(nativeId: string): Promise<boolean | null>;

  /**
   * Resolve nativeId's cast availability state.
   */
  isCastAvailable(nativeId: string): Promise<boolean | null>;

  /**
   * Resolve nativeId's current casting state.
   */
  isCasting(nativeId: string): Promise<boolean | null>;

  /**
   * Initiate casting for nativeId's player.
   */
  castVideo(nativeId: string): Promise<void>;

  /**
   * Stop casting for nativeId's player.
   */
  castStop(nativeId: string): Promise<void>;

  /**
   * Skip current ad for nativeId's player.
   */
  skipAd(nativeId: string): Promise<void>;

  /**
   * Applies the JS-updated IMA settings for a before-initialization callback.
   */
  setPreparedImaSettings(id: number, settings: ImaSettings): Promise<void>;

  /**
   * Check if player can play at specified playback speed (iOS only).
   */
  canPlayAtPlaybackSpeed(
    nativeId: string,
    playbackSpeed: number
  ): Promise<boolean | null>;

  /**
   * Creates a new Player instance using the provided config.
   */
  initializeWithConfig(
    nativeId: string,
    config?: Record<string, any>,
    networkNativeId?: string,
    decoderNativeId?: string
  ): Promise<void>;

  /**
   * Creates a new analytics-enabled Player instance.
   */
  initializeWithAnalyticsConfig(
    nativeId: string,
    analyticsConfig: Record<string, any>,
    config?: Record<string, any>,
    networkNativeId?: string,
    decoderNativeId?: string
  ): Promise<void>;

  /**
   * Load source into the player.
   * Requires SourceModule dependency.
   */
  loadSource(nativeId: string, sourceNativeId: string): Promise<void>;

  /**
   * Load offline content into the player.
   */
  loadOfflineContent(
    nativeId: string,
    offlineContentId: string,
    options?: Record<string, any>
  ): Promise<void>;

  /**
   * Get current audio track.
   */
  getAudioTrack(nativeId: string): Promise<any | null>;

  /**
   * Get available audio tracks.
   */
  getAvailableAudioTracks(nativeId: string): Promise<any[]>;

  /**
   * Set audio track.
   */
  setAudioTrack(nativeId: string, trackId: string): Promise<void>;

  /**
   * Get current subtitle track.
   */
  getSubtitleTrack(nativeId: string): Promise<any | null>;

  /**
   * Get available subtitle tracks.
   */
  getAvailableSubtitles(nativeId: string): Promise<any[]>;

  /**
   * Set subtitle track.
   */
  setSubtitleTrack(nativeId: string, trackId: string | null): Promise<void>;

  /**
   * Schedule an ad.
   */
  scheduleAd(nativeId: string, adConfig: Record<string, any>): Promise<void>;

  /**
   * Get thumbnail for time position.
   */
  getThumbnail(nativeId: string, time: number): Promise<any | null>;

  /**
   * Get current video quality.
   */
  getVideoQuality(nativeId: string): Promise<any | null>;

  /**
   * Get available video qualities.
   */
  getAvailableVideoQualities(nativeId: string): Promise<any[]>;

  /**
   * Set video quality.
   */
  setVideoQuality(nativeId: string, qualityId: string): Promise<void>;
}

export default requireNativeModule<PlayerModule>('PlayerModule');
