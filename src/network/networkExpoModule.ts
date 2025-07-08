import { requireNativeModule } from 'expo-modules-core';
import { HttpRequest, HttpResponse, NetworkConfig } from './networkConfig';

/**
 * Native NetworkExpoModule interface using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
interface NetworkExpoModuleInterface {
  initWithConfig(nativeId: string, config: NetworkConfig): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  setPreprocessedHttpRequest(
    requestId: string,
    request: HttpRequest
  ): Promise<void>;
  setPreprocessedHttpResponse(
    responseId: string,
    response: HttpResponse
  ): Promise<void>;
}

/**
 * Expo-based NetworkModule implementation.
 * This provides the same functionality as the legacy NetworkModule but uses Expo's modern module system.
 */
const NetworkExpoModule =
  requireNativeModule<NetworkExpoModuleInterface>('NetworkExpoModule');

export default NetworkExpoModule;
export { NetworkExpoModuleInterface };
