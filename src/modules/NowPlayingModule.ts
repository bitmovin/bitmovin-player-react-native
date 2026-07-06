import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type NowPlayingModuleEvents = Record<string, any>;

declare class NowPlayingModule extends NativeModule<NowPlayingModuleEvents> {
  /**
   * Get whether the Now Playing integration is enabled for the specified player.
   */
  isEnabled(playerId: string): Promise<boolean | null>;

  /**
   * Enable or disable the Now Playing integration for the specified player.
   */
  setEnabled(playerId: string, enabled: boolean): Promise<void>;
}

export default requireNativeModule<NowPlayingModule>('NowPlayingModule');
