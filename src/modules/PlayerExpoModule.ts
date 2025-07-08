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

  // TODO: Add remaining method types as they are migrated
  // Next batch: getDuration, isPlaying, isPaused, then complex methods
}

export default requireNativeModule<PlayerExpoModuleType>('PlayerExpoModule');
