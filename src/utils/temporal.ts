/**
 * Branded numeric type representing a duration in milliseconds.
 *
 * Used in the SDK to distinguish millisecond values from other units while
 * still behaving as a `number` at runtime. For public/app-level APIs, prefer
 * accepting `number` and applying this brand internally.
 *
 * @example
 * // ✅ Recommended: consuming as a number
 * function logDuration(value: number): void;
 * // `Milliseconds` is still compatible with `number`:
 * const timeout: Milliseconds = 1_000;
 * logDuration(timeout);
 *
 * // ❌ Discouraged: exposing the branded type in APIs
 * function setTimeoutMs(value: Milliseconds): void;
 * // Callers now have to write:
 * setTimeoutMs(1_000 as Milliseconds);
 */
export type Milliseconds = number & { readonly __unit: 'ms' };
/**
 * Branded numeric type representing a duration in seconds.
 *
 * Used in the SDK to distinguish seconds values from other units while
 * still behaving as a `number` at runtime. For public/app-level APIs, prefer
 * accepting `number` and applying this brand internally.
 *
 * @example
 * // ✅ Recommended: consuming as a number
 * function logDuration(value: number): void;
 * // `Seconds` is still compatible with `number`:
 * const timeout: Seconds = 60;
 * logDuration(timeout);
 *
 * // ❌ Discouraged: exposing the branded type in APIs
 * function setTimeoutSec(value: Seconds): void;
 * // Callers now have to write:
 * setTimeoutSec(60 as Seconds);
 */
export type Seconds = number & { readonly __unit: 's' };

/**
 * Represents a time range with a start and end value in the same units.
 *
 * @typeParam T - Time representation, for example {@link Seconds} or {@link Milliseconds}.
 */
export interface TimeRange<T> {
  /**
   * The start time of the range.
   */
  start?: T;
  /**
   * The end time of the range.
   */
  end?: T;
}
