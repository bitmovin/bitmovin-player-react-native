import type { SharedPlayer } from '../modules/playerModule';
import type { NativeModule } from 'expo-modules-core';
import { requireNativeModule } from 'expo-modules-core';

export type PlayerAnalyticsModuleEvents = Record<string, any>;

/**
 * Native PlayerAnalyticsModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class PlayerAnalyticsModule extends NativeModule<PlayerAnalyticsModuleEvents> {
  sendCustomDataEvent(
    player: SharedPlayer,
    customData: Record<string, any>
  ): Promise<void>;
  getUserId(player: SharedPlayer): Promise<string | null>;
}

export default requireNativeModule<PlayerAnalyticsModule>(
  'PlayerAnalyticsModule'
);
