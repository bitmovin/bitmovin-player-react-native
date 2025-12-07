/**
 * Branded numeric type representing a duration or timestamp in milliseconds.
 *
 * This is used in the SDK to make it clear a value is in milliseconds.
 * In the code it behaves just like a normal `number`.
 *
 * For public or app-level APIs, it's better to accept `number` and
 * apply the brand internally if needed, rather than requiring callers to
 * cast to `Milliseconds`.
 *
 * @example
 * // ✅ Recommended: consuming as a number
 * function logDuration(value: number): void;
 * // `Milliseconds` is still compatible with `number`:
 * const timeout: Milliseconds = 1_000;
 * logDuration(timeout);
 *
 * // ❌ Discouraged: forcing branded type on your own API
 * function setTimeoutMs(value: Milliseconds): void;
 * // Callers now have to write:
 * setTimeoutMs(1_000 as Milliseconds);
 */
export type Milliseconds = number & { readonly __unit: 'ms' };
/**
 * Branded numeric type representing a duration or timestamp in seconds.
 *
 * This is used in the SDK to make it clear a value is in seconds.
 * In the code it behaves just like a normal `number`.
 *
 * For public or app-level APIs, it's better to accept `number` and
 * apply the brand internally if needed, rather than requiring callers to
 * cast to `Seconds`.
 *
 * @example
 * // ✅ Recommended: consuming as a number
 * function logDuration(value: number): void;
 * // `Seconds` is still compatible with `number`:
 * const timeout: Seconds = 60;
 * logDuration(timeout);
 *
 * // ❌ Discouraged: forcing branded type on your own API
 * function setTimeoutSec(value: Seconds): void;
 * // Callers now have to write:
 * setTimeoutSec(60 as Seconds);
 */
export type Seconds = number & { readonly __unit: 's' };

export interface TimeRange<T> {
  /**
   * The start date of the range.
   */
  start?: T;
  /**
   * The end date of the range.
   */
  end?: T;
}