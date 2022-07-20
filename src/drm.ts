import { NativeModules } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import NativeInstance, { NativeInstanceConfig } from './nativeInstance';

const DRMModule = NativeModules.DRMModule;

/**
 * Represents a FairPlay Streaming DRM config.
 */
export interface FairplayConfig {
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
  /**
   * A block to prepare the loaded certificate before building SPC data and passing it into the
   * system. This is needed if the server responds with anything else than the certificate, e.g. if
   * the certificate is wrapped into a JSON object. The server response for the certificate request
   * is passed as parameter “as is”.
   *
   * Note that both the passed `certificate` data and this block return value should be a Base64
   * string. So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @param certificate - Base64 encoded certificate data.
   * @returns The processed Base64 encoded certificate.
   */
  prepareCertificate?: (certificate: string) => string;
  /**
   * A block to prepare the data which is sent as the body of the POST request for syncing the DRM
   * license information.
   *
   * Note that both the passed `syncMessage` data and this block return value should be a Base64
   * string. So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @param message - Base64 encoded message data.
   * @param assetId - Asset ID.
   * @returns The processed Base64 encoded sync message.
   */
  prepareSyncMessage?: (syncMessage: string, assetId: string) => string;
  /**
   * A block to prepare the URI (without the skd://) from the HLS manifest before passing it to the
   * system.
   *
   * @param licenseServerUrl - License server URL string.
   * @returns The processed license server URL string.
   */
  prepareLicenseServerUrl?: (licenseServerUrl: string) => string;
  /**
   * A block to prepare the `contentId`, which is sent to the FairPlay Streaming license server as
   * request body, and which is used to build the SPC data. As many DRM providers expect different,
   * vendor-specific messages, this can be done using this user-defined block. The parameter is the
   * skd:// URI extracted from the HLS manifest (m3u8) and the return value should be the contentID
   * as string.
   *
   * @param contentId - Extracted content id string.
   * @returns The processed contentId.
   */
  prepareContentId?: (contentId: string) => string;
  /**
   * A block to provide the license for the given `assetId`.
   *
   * This should only be used when the license is stored locally. If the block returns nil we will
   * try to fetch the license using the available information in the same `FairplayConfig`.
   *
   * If no `certificateUrl` is present at this point we will emit a `SourceErrorEvent`.
   *
   * Use this block for the following use-cases:
   *
   * - License caching during playback or for future playback sessions.
   *
   * If the provided license is expired, the playback will fail. License duration handling has to be
   * handled by the application.
   *
   * Note that this block return value should be a Base64 string. So use whatever solution suits you
   * best to handle Base64 in React Native.
   *
   * @param assetId - Provided `assetId` value.
   * @returns The persisted Base64 encoded license data.
   */
  provideLicenseData?: (assetId: string) => string | null;
  /**
   * A block to enable custom persisting of license data for the given `assetId`.
   *
   * Use this block for the following use-cases:
   *
   * - To store the license data locally for future playback sessions.
   * - To update the license during a playback session if the license requires updating.
   *
   * In both use-cases, it’s required that the license is persistable on the device.
   * Playback will fail otherwise.
   *
   * Note that the `licenseData` is provided as a Base64 string. So use whatever solution suits you
   * best to handle Base64 in React Native.
   *
   * @param assetId - Provided `assetId` value.
   * @param licenseData - License data as a Base64 encoded string.
   */
  persistLicenseData?: (assetId: string, licenseData: string) => void;
}

/**
 * Represents a Widevine Streaming DRM config.
 */
export interface WidevineConfig {
  /**
   * Set widevine's preferred security level on Android.
   */
  preferredSecurityLevel?: string;
}

/**
 * Represents the general Streaming DRM config.
 */
export interface DRMConfig extends NativeInstanceConfig {
  /**
   * The DRM license acquisition URL.
   */
  licenseUrl: string;
  /**
   * A block to prepare the data which is sent as the body of the POST license request.
   * As many DRM providers expect different, vendor-specific messages, this can be done using
   * this user-defined block.
   *
   * Note that both the passed `message` data and this block return value should be a Base64 string.
   * So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @param message - Base64 encoded message data.
   * @param assetId - Optional asset ID. Only provided by iOS.
   * @returns The processed Base64 encoded message.
   */
  prepareMessage?: (message: string, assetId?: string) => string;
  /**
   * A block to prepare the loaded CKC Data before passing it to the system. This is needed if the
   * server responds with anything else than the license, e.g. if the license is wrapped into a JSON
   * object.
   *
   * Note that both the passed `license` data and this block return value should be a Base64 string.
   * So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @param license - Base64 encoded license data.
   * @returns The processed Base64 encoded license.
   */
  prepareLicense?: (license: string) => string;
  /**
   * FairPlay specific configuration. Only appliable for iOS.
   */
  fairplay?: FairplayConfig;
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
    // Register this object as a callable module so it's possible to
    // call functions on it from native code, e.g `onPrepareMessage`.
    BatchedBridge.registerCallableModule(`DRM-${this.nativeId}`, this);
    // Create native configuration object.
    DRMModule.initWithConfig(this.nativeId, this.config);
  }

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareCertificate` function to native's `certificate` data and store
   * the result back in `DRMModule`.
   *
   * Called from native code when `FairplayConfig.prepareCertificate` is dispatched.
   *
   * @param certificate - Base64 encoded certificate data.
   */
  onPrepareCertificate = (certificate: string) => {
    if (this.config?.fairplay?.prepareCertificate) {
      DRMModule.setPreparedCertificate(
        this.nativeId,
        this.config?.fairplay?.prepareCertificate?.(certificate)
      );
    }
  };

  /**
   * Applies the user-defined `prepareMessage` function to native's `message` data and store
   * the result back in `DRMModule`.
   *
   * Called from native code when `prepareMessage` is dispatched.
   *
   * @param message - Base64 encoded message data.
   * @param assetId - Optional asset ID. Only sent by iOS.
   */
  onPrepareMessage = (message: string, assetId?: string) => {
    if (this.config?.prepareMessage) {
      DRMModule.setPreparedMessage(
        this.nativeId,
        this.config.prepareMessage?.(message, assetId)
      );
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareSyncMessage` function to native's `syncMessage` data and
   * store the result back in `DRMModule`.
   *
   * Called from native code when `FairplayConfig.prepareSyncMessage` is dispatched.
   *
   * @param syncMessage - Base64 encoded sync SPC message data.
   */
  onPrepareSyncMessage = (syncMessage: string, assetId: string) => {
    if (this.config?.fairplay?.prepareSyncMessage) {
      DRMModule.setPreparedSyncMessage(
        this.nativeId,
        this.config?.fairplay?.prepareSyncMessage?.(syncMessage, assetId)
      );
    }
  };

  /**
   * Applies the user-defined `prepareLicense` function to native's `license` data and store
   * the result back in `DRMModule`.
   *
   * Called from native code when `prepareLicense` is dispatched.
   *
   * @param license - Base64 encoded license data.
   */
  onPrepareLicense = (license: string) => {
    if (this.config?.prepareLicense) {
      DRMModule.setPreparedLicense(
        this.nativeId,
        this.config.prepareLicense?.(license)
      );
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareLicenseServerUrl` function to native's `licenseServerUrl` data
   * and store the result back in `DRMModule`.
   *
   * Called from native code when `FairplayConfig.prepareLicenseServerUrl` is dispatched.
   *
   * @param licenseServerUrl - The license server URL string.
   */
  onPrepareLicenseServerUrl = (licenseServerUrl: string) => {
    if (this.config?.fairplay?.prepareLicenseServerUrl) {
      DRMModule.setPreparedLicenseServerUrl(
        this.nativeId,
        this.config?.fairplay?.prepareLicenseServerUrl?.(licenseServerUrl)
      );
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `prepareContentId` function to native's `contentId` string
   * and store the result back in `DRMModule`.
   *
   * Called from native code when `FairplayConfig.prepareContentId` is dispatched.
   *
   * @param contentId - The extracted contentId string.
   */
  onPrepareContentId = (contentId: string) => {
    if (this.config?.fairplay?.prepareContentId) {
      DRMModule.setPreparedContentId(
        this.nativeId,
        this.config?.fairplay?.prepareContentId?.(contentId)
      );
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `provideLicenseData` function to native's `assetId` string
   * and store the result back in `DRMModule`.
   *
   * Called from native code when `FairplayConfig.provideLicenseData` is dispatched.
   *
   * @param assetId - The provided asset ID.
   */
  onProvideLicenseData = (assetId: string) => {
    if (this.config?.fairplay?.provideLicenseData) {
      DRMModule.setProvidedLicenseData(
        this.nativeId,
        this.config?.fairplay?.provideLicenseData?.(assetId)
      );
    }
  };

  /**
   * iOS only.
   *
   * Applies the user-defined `persistLicenseData` function to native's `assetId` and `licenseData`
   * Base64 encoded string.
   *
   * Called from native code when `FairplayConfig.persistLienseData` is dispatched.
   *
   * @param assetId - The provided asset ID.
   * @param licenseData - License data as a Base64 encoded string.
   */
  onPersistLicenseData = (assetId: string, licenseData: string) => {
    this.config?.fairplay?.persistLicenseData?.(assetId, licenseData);
  };
}
