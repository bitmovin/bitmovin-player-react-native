import { requireNativeModule } from 'expo-modules-core';

export interface PlayerExpoModuleType {
  /**
   * Returns the count of active players for debugging purposes
   */
  getPlayerCount(): number;

  /**
   * Checks if a player with the given nativeId exists
   */
  hasPlayer(nativeId: string): boolean;

  // PHASE 2: Simple player control methods

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

  // TODO: Add remaining method types as they are migrated
  // Next batch: loadSource (requires SourceModule), complex initialization methods
}

export default requireNativeModule<PlayerExpoModuleType>('PlayerExpoModule');
