import { Platform } from 'react-native';
import type { FairplayContentKeyRequest } from '../events';
import { getNativeSource } from '../modules/SourceModule';
import type { Source } from '../source';

/**
 * Provides FairPlay-specific DRM runtime APIs for an active {@link Source}.
 *
 * Accessible via {@link Source.drm}.fairplay.
 *
 * @platform iOS, tvOS
 */
export class FairplayDrmApi {
  constructor(private readonly source: Source) {}

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
    return getNativeSource(this.source)?.drmFairplayRenewExpiringLicense(
      contentKeyRequest.skdUri
    );
  };
}
