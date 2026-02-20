import { Platform } from 'react-native';
import { FairplayContentKeyRequest } from '../events';
import SourceModule from '../modules/SourceModule';

/**
 * Provides FairPlay-specific DRM runtime APIs for an active {@link Source}.
 *
 * Accessible via {@link Source.drm}.fairplay.
 *
 * @platform iOS, tvOS
 */
export class FairplayDrmApi {
  constructor(private readonly sourceNativeId: string) {}

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
      console.warn(
        `[Source ${this.sourceNativeId}] renewExpiringLicense is not available on Android.`
      );
      return;
    }
    return SourceModule.renewExpiringLicense(
      this.sourceNativeId,
      contentKeyRequest.skdUri
    );
  };
}
