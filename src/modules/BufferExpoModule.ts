import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { BufferLevels } from '../bufferApi';

export type BufferExpoModuleEvents = Record<string, any>;

declare class BufferExpoModule extends NativeModule<BufferExpoModuleEvents> {
  /**
   * Get buffer level for the specified player and buffer type.
   */
  getLevel(playerId: string, type: string): Promise<BufferLevels>;

  /**
   * Set target level for the specified player and buffer type.
   */
  setTargetLevel(playerId: string, type: string, value: number): Promise<void>;
}

export default requireNativeModule<BufferExpoModule>('BufferExpoModule');
