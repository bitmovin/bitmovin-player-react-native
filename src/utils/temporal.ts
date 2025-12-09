/**
 * Numeric type representing a duration in milliseconds.
 *
 * Used in the SDK to distinguish millisecond values from other units.
 */
export type Milliseconds = number;
/**
 * Numeric type representing a duration in seconds.
 *
 * Used in the SDK to distinguish seconds values from other units.
 */
export type Seconds = number;

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
