import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type PlayerAnalyticsModuleEvents = Record<string, any>;

/**
 * Native PlayerAnalyticsModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class PlayerAnalyticsModule extends NativeModule<PlayerAnalyticsModuleEvents> {
  sendCustomDataEvent(
    playerId: string,
    customData: Record<string, any>
  ): Promise<void>;
  getUserId(playerId: string): Promise<string | null>;
}

export default requireNativeModule<PlayerAnalyticsModule>(
  'PlayerAnalyticsModule'
);
