import type { SharedPlayer } from './playerModule';
import type { NativeModule } from 'expo-modules-core';
import { requireNativeModule } from 'expo-modules-core';
import type { BufferLevels } from '../bufferApi';

export type BufferModuleEvents = Record<string, any>;

declare class BufferModule extends NativeModule<BufferModuleEvents> {
  /**
   * Get buffer level for the specified player and buffer type.
   */
  getLevel(player: SharedPlayer, type: string): Promise<BufferLevels>;

  /**
   * Set target level for the specified player and buffer type.
   */
  setTargetLevel(
    player: SharedPlayer,
    type: string,
    value: number
  ): Promise<void>;
}

export default requireNativeModule<BufferModule>('BufferModule');
