import { NativeModules } from 'react-native';
import NativeInstance, { NativeInstanceConfig } from './nativeInstance';

const DRMModule = NativeModules.DRMModule;

/**
 * Represents a FairPlay Streaming DRM config.
 */
export interface FairPlayConfig {
  /**
   * The URL to the FairPlay Streaming certificate of the license server.
   */
  certificateUrl?: string;
  /**
   * A dictionary to specify custom HTTP headers for the license request.
   */
  licenseRequestHeaders?: Record<string, string>;
  /**
   * A dictionary to specify custom HTTP headers for the certificate request.
   */
  certificateRequestHeaders?: Record<string, string>;
}

/**
 * Represents a Widevine Streaming DRM config.
 */
export interface WidevineConfig {
  /**
   * Set widevine's preferred security level in Android.
   */
  prefferedSecurityLevel?: string;
}

export interface DRMConfig extends NativeInstanceConfig {
  /**
   * The DRM license acquisition URL.
   */
  licenseUrl: string;
  /**
   * FairPlay specific configuration. Only appliable for iOS.
   */
  fairPlay?: FairPlayConfig;
  /**
   * Widevine specific configuration. Only appliable for Android.
   */
  widevine?: WidevineConfig;
}

/**
 * Represents a native DRM configuration object.
 */
export class DRM extends NativeInstance<DRMConfig> {
  constructor(config?: DRMConfig) {
    super(config);
    DRMModule.initWithConfig(this.nativeId, this.config);
  }
}
