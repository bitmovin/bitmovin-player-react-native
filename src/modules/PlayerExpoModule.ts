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

  // TODO: Add remaining method types as they are migrated
  // Next batch: seek, timeShift, destroy, then complex methods
}

export default requireNativeModule<PlayerExpoModuleType>('PlayerExpoModule');
