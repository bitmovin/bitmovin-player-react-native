/**
 * Selects public API functions for a native peer, excluding the internal peer
 * property itself. SDK method signatures therefore stay declared once.
 * Methods that convert public objects to native peers override their raw types.
 * For example: `type NativeBufferApi = SharedObject & NativeMethods<BufferApi>`.
 * @internal
 */
export type NativeMethods<Api> = Pick<
  Api,
  {
    [Key in Exclude<keyof Api, 'native'>]-?: Api[Key] extends (
      ...args: never[]
    ) => unknown
      ? Key
      : never;
  }[Exclude<keyof Api, 'native'>]
>;
