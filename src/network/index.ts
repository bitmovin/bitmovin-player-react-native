import {
  HttpRequestType,
  HttpRequest,
  HttpResponse,
  NetworkConfig,
} from './networkConfig';
import { NetworkExpo } from './networkExpo';

// Export config types from Network module.
export { HttpRequestType, HttpRequest, HttpResponse, NetworkConfig };

/**
 * Represents a native Network configuration object.
 * Now uses the Expo modules implementation for improved performance and modern architecture.
 * @internal
 */
export class Network extends NetworkExpo {
  // NetworkExpo provides all the implementation, maintaining backward compatibility
}
