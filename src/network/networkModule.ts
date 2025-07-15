import { NativeModule, requireNativeModule } from 'expo-modules-core';
import {
  HttpRequest,
  HttpResponse,
  NetworkConfig,
  HttpRequestType,
} from './networkConfig';

export type NetworkModuleEvents = {
  onPreprocessHttpRequest: ({
    nativeId,
    requestId,
    type,
    request,
  }: {
    nativeId: string;
    requestId: string;
    type: HttpRequestType;
    request: HttpRequest;
  }) => void;
  onPreprocessHttpResponse: ({
    nativeId,
    responseId,
    type,
    response,
  }: {
    nativeId: string;
    responseId: string;
    type: HttpRequestType;
    response: HttpResponse;
  }) => void;
};

/**
 * Native NetworkModule using Expo modules API.
 * Provides modern async/await interface while maintaining backward compatibility.
 */
declare class NetworkModule extends NativeModule<NetworkModuleEvents> {
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

export default requireNativeModule<NetworkModule>('NetworkModule');
