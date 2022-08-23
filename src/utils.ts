/**
 * Utility type that maps the specified optional props from the target `Type` to be
 * required props. Note all the other props stay unaffected.
 *
 * @example
 * type MyType = {
 *   a?: string;
 *   b?: number;
 *   c?: boolean;
 * };
 *
 * type MyRequiredType = MakeRequired<MyType, 'a' | 'c'> // => { a: string; b?: number; c: boolean; }
 */
export type MakeRequired<Type, Key extends keyof Type> = Omit<Type, Key> &
  Required<Pick<Type, Key>>;
