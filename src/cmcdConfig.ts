/**
 * Contains config values regarding Common Media Client Data (CMCD).
 * Please find more information about the Consumer Technology Association (CTA) Specification in https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf
 *
 * @platform iOS
 */
export interface CmcdConfig {
  /**
   * Enables sending Common Media Client Data (CMCD) on requests as HTTP Headers.
   *
   * Note:
   *   - Common Media Client Data (CMCD) is only supported through HTTP Headers.
   *   - Per default, CMCD data are only sent on media (video and audio) requests.
   *     To enable them also for manifest requests, {@link TweaksConfig.isCustomHlsLoadingEnabled} needs to be disabled.
   *   - Only CMCD v1 is supported for now.
   *   - Only supported on iOS and tvOS 18 as well as visionOS 2 upwards.
   *
   * Default is `false`.
   *
   * @platform iOS
   */
  isEnabled?: boolean;
}
