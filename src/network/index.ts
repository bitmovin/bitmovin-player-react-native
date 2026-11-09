import type { HttpRequest, HttpResponse, NetworkConfig } from './networkConfig';
import { HttpRequestType } from './networkConfig';

export { HttpRequestType };
export type { HttpRequest, HttpResponse, NetworkConfig };

/**
 * Compatibility wrapper for Network configuration.
 * @internal
 */
export class Network {
  constructor(readonly config?: NetworkConfig) {}
}
