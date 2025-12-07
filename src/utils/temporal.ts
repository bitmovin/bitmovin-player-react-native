/**
 * Branded numeric type representing a duration or timestamp in milliseconds.
 *
 * @remarks
 * - Primarily used by the SDK to *annotate return types* with units.
 * - Behaves like `number` in user code (you can pass it anywhere a `number` is expected).
 * - **Do not** require callers of your own app APIs to pass `Milliseconds` –
 *   accept plain `number` instead and brand internally if needed.
 *
 * @example
 * // ✅ Recommended: consume as a number
 * player.onMetadata(event => {
 *   const startMs = event.startTimeMs; // Milliseconds
 *   doSomethingWithNumber(startMs);    // accepts number, works fine
 * });
 *
 * // ❌ Discouraged: forcing branded type on your own API
 * function seekTo(position: Milliseconds) {
 *   // callers now have to write:
 *   seekTo(1000 as Milliseconds);
 * }
 */
export type Milliseconds = number & { readonly __unit: 'ms' };
/**
 * Branded number in **seconds**.
 *
 * @remarks
 * - Used by the SDK to document units on fields and return types.
 * - You can pass this anywhere a plain `number` is expected.
 * - **Avoid** using `Seconds` as required parameter types in your own APIs;
 *   prefer `number` and convert internally if needed.
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