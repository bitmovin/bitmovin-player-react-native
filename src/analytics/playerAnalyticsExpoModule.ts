import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type PlayerAnalyticsExpoModuleEvents = Record<string, any>;

/**
 * Native PlayerAnalyticsExpoModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class PlayerAnalyticsExpoModule extends NativeModule<PlayerAnalyticsExpoModuleEvents> {
  sendCustomDataEvent(
    playerId: string,
    customData: Record<string, any>
  ): Promise<void>;
  getUserId(playerId: string): Promise<string | null>;
}

export default requireNativeModule<PlayerAnalyticsExpoModule>(
  'PlayerAnalyticsExpoModule'
);
