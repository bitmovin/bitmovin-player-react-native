import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type MediaControlsModuleEvents = Record<string, any>;

declare class MediaControlsModule extends NativeModule<MediaControlsModuleEvents> {
  /**
   * Get whether the media controls integration is enabled for the specified player.
   */
  isEnabled(playerId: string): Promise<boolean | null>;

  /**
   * Enable or disable the media controls integration for the specified player.
   */
  setEnabled(playerId: string, enabled: boolean): Promise<void>;
}

export default Platform.OS === 'ios'
  ? requireNativeModule<MediaControlsModule>('MediaControlsModule')
  : null;
