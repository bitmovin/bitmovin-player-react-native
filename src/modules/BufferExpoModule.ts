import { requireNativeModule } from 'expo-modules-core';

export interface BufferExpoModuleType {
  /**
   * Get buffer level for the specified player and buffer type.
   */
  getLevel(playerId: string, type: string): Promise<number | null>;

  // TODO: Add method types as they are migrated from BufferModule
  // setTargetLevel, getTargetLevel, etc.
}

export default requireNativeModule<BufferExpoModuleType>('BufferExpoModule');
