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

  // TODO: Add method types as they are migrated from PlayerModule
  // This will grow incrementally during Phase 3 migration
}

export default requireNativeModule<PlayerExpoModuleType>('PlayerExpoModule');