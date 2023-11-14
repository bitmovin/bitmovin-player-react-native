/**
 * Contains config values regarding the behaviour when playing live streams.
 */
export interface LiveConfig {
  /**
   * The minimum buffer depth of a stream needed to enable time shifting.
   * When the internal value for the maximal possible timeshift is lower than this value,
   * timeshifting should be disabled. That means `Player.maxTimeShift` returns `0` in that case.
   * This value should always be non-positive value, default value is `-40`.
   */
  minTimeshiftBufferDepth?: number;
}
