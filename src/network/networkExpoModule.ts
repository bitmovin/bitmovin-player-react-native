import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { HttpRequest, HttpResponse, NetworkConfig } from './networkConfig';

export type NetworkExpoModuleEvents = Record<string, any>;

/**
 * Native NetworkExpoModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class NetworkExpoModule extends NativeModule<NetworkExpoModuleEvents> {
  initializeWithConfig(nativeId: string, config: NetworkConfig): Promise<void>;
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

export default requireNativeModule<NetworkExpoModule>('NetworkExpoModule');
