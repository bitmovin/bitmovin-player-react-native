/**
 * Represents a FairPlay Streaming DRM config.
 */
export interface FairplayConfig {
  /**
   * The DRM license acquisition URL.
   */
  licenseUrl: string;
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
   * A block to prepare the data which is sent as the body of the POST license request.
   * As many DRM providers expect different, vendor-specific messages, this can be done using
   * this user-defined block.
   *
   * Note that both the passed `message` data and this block return value should be a Base64 string.
   * So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @param message - Base64 encoded message data.
   * @param assetId - Stream asset ID.
   * @returns The processed Base64 encoded message.
   */
  prepareMessage?: (message: string, assetId: string) => string;
  /**
   * A block to prepare the data which is sent as the body of the POST request for syncing the DRM
   * license information.
   *
   * Note that both the passed `syncMessage` data and this block return value should be a Base64
   * string. So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @param syncMessage - Base64 encoded message data.
   * @param assetId - Asset ID.
   * @returns The processed Base64 encoded sync message.
   */
  prepareSyncMessage?: (syncMessage: string, assetId: string) => string;
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
}
