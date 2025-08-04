import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { BufferLevels } from '../bufferApi';

export type BufferModuleEvents = Record<string, any>;

declare class BufferModule extends NativeModule<BufferModuleEvents> {
  /**
   * Get buffer level for the specified player and buffer type.
   */
  getLevel(playerId: string, type: string): Promise<BufferLevels>;

  /**
   * Set target level for the specified player and buffer type.
   */
  setTargetLevel(playerId: string, type: string, value: number): Promise<void>;
}

export default requireNativeModule<BufferModule>('BufferModule');
