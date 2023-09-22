/**
 * Represents a Widevine Streaming DRM config.
 * @platform Android, iOS (only for casting).
 */
export interface WidevineConfig {
  /**
   * The DRM license acquisition URL.
   */
  licenseUrl: string;
  /**
   * A map containing the HTTP request headers, or null.
   */
  httpHeaders?: Record<string, string>;
  /**
   * A block to prepare the data which is sent as the body of the POST license request.
   * As many DRM providers expect different, vendor-specific messages, this can be done using
   * this user-defined block.
   *
   * Note that both the passed `message` data and this block return value should be a Base64 string.
   * So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @platform Android
   *
   * @param message - Base64 encoded message data.
   * @returns The processed Base64 encoded message.
   */
  prepareMessage?: (message: string) => string;
  /**
   * A block to prepare the loaded CKC Data before passing it to the system. This is needed if the
   * server responds with anything else than the license, e.g. if the license is wrapped into a JSON
   * object.
   *
   * Note that both the passed `license` data and this block return value should be a Base64 string.
   * So use whatever solution suits you best to handle Base64 in React Native.
   *
   * @platform Android
   *
   * @param license - Base64 encoded license data.
   * @returns The processed Base64 encoded license.
   */
  prepareLicense?: (license: string) => string;
  /**
   * Set widevine's preferred security level.
   *
   * @platform Android
   */
  preferredSecurityLevel?: string;
  /**
   * Indicates if the DRM sessions should be kept alive after a source is unloaded.
   * This allows DRM sessions to be reused over several different source items with the same DRM configuration as well
   * as the same DRM scheme information.
   * Default: `false`
   *
   * @platform Android
   */
  shouldKeepDrmSessionsAlive?: boolean;
}
