/**
 * Contains config values regarding Common Media Client Data (CMCD).
 * More information about the Consumer Technology Association (CTA) Specification is available at https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf
 *
 * @platform iOS 18+, tvOS 18+
 */
export interface CmcdConfig {
  /**
   * Enables sending Common Media Client Data (CMCD) on requests as HTTP headers.
   *
   * Note:
   *   - Common Media Client Data (CMCD) is only supported through HTTP headers.
   *   - By default, CMCD data is only sent on media (video and audio) requests.
   *     To enable them also for manifest requests, {@link TweaksConfig.isCustomHlsLoadingEnabled} needs to be disabled.
   *   - Only CMCD v1 is supported for now.
   *   - Only supported on iOS 18+ and tvOS 18+.
   *
   * Default is `false`.
   *
   * @platform iOS 18+, tvOS 18+
   */
  isEnabled?: boolean;
}
