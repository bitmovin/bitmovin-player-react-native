import { Platform } from 'react-native';
import type { FairplayContentKeyRequest } from '../events';
import {
  nativeSourceReference,
  type NativeSourceReference,
} from '../modules/SourceModule';
import type { Source } from '../source';

/**
 * Provides FairPlay-specific DRM runtime APIs for an active {@link Source}.
 *
 * Accessible via {@link Source.drm}.fairplay.
 *
 * @platform iOS, tvOS
 */
export class FairplayDrmApi {
  private readonly nativeSource: NativeSourceReference;

  constructor(source: Source | NativeSourceReference) {
    this.nativeSource = nativeSourceReference(source);
  }

  /**
   * Renews an expiring FairPlay license for the provided content key request.
   * Has no effect if called on Android.
   *
   * @platform iOS, tvOS
   * @param contentKeyRequest - The content key request from a {@link FairplayLicenseAcquiredEvent}.
   */
  renewExpiringLicense = async (
    contentKeyRequest: FairplayContentKeyRequest
  ): Promise<void> => {
    if (Platform.OS === 'android') {
      console.warn('renewExpiringLicense is not available on Android.');
      return;
    }
    return this.nativeSource()?.drmFairplayRenewExpiringLicense(
      contentKeyRequest.skdUri
    );
  };
}
