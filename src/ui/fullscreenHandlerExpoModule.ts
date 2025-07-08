import { requireNativeModule } from 'expo-modules-core';

/**
 * Native FullscreenHandlerExpoModule interface using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
interface FullscreenHandlerExpoModuleInterface {
  registerHandler(nativeId: string): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  onFullscreenChanged(nativeId: string, isFullscreenEnabled: boolean): any;
  setIsFullscreenActive(
    nativeId: string,
    isFullscreenActive: boolean
  ): Promise<void>;
}

/**
 * Expo-based FullscreenHandlerModule implementation.
 * This provides the same functionality as the legacy FullscreenHandlerModule but uses Expo's modern module system.
 */
const FullscreenHandlerExpoModule =
  requireNativeModule<FullscreenHandlerExpoModuleInterface>(
    'FullscreenHandlerExpoModule'
  );

export default FullscreenHandlerExpoModule;
export { FullscreenHandlerExpoModuleInterface };
