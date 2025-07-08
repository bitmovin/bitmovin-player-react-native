import { requireNativeModule } from 'expo-modules-core';

/**
 * Native PlayerAnalyticsExpoModule interface using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
interface PlayerAnalyticsExpoModuleInterface {
  sendCustomDataEvent(
    playerId: string,
    customData: Record<string, any>
  ): Promise<void>;
  getUserId(playerId: string): Promise<string | null>;
}

/**
 * Expo-based PlayerAnalyticsModule implementation.
 * This provides the same functionality as the legacy PlayerAnalyticsModule but uses Expo's modern module system.
 */
const PlayerAnalyticsExpoModule =
  requireNativeModule<PlayerAnalyticsExpoModuleInterface>(
    'PlayerAnalyticsExpoModule'
  );

export default PlayerAnalyticsExpoModule;
export { PlayerAnalyticsExpoModuleInterface };
