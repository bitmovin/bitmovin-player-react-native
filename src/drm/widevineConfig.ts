/**
 * Represents a Widevine Streaming DRM config.
 */
export interface WidevineConfig {
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
   * @param license - Base64 encoded license data.
   * @returns The processed Base64 encoded license.
   */
  prepareLicense?: (license: string) => string;
  /**
   * Set widevine's preferred security level. Android only.
   */
  preferredSecurityLevel?: string;
}
