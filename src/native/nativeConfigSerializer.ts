import { NativeCallbacks } from './nativeCallbacks';

/**
 * Serializes configuration data, replacing functions with string tokens. Native
 * converters pass those tokens to the dispatcher to call the matching handler.
 * A native subclass passes the weak callback to its constructor, then retains
 * the dispatcher on its JS instance for the configured callbacks' lifetime:
 *
 * ```ts
 * const serializer = new NativeConfigSerializer();
 * super(serializer.serialize(config), serializer.dispatcher.callback);
 * serializer.dispatcher.retain(this);
 * ```
 *
 * Callbacks normally read the current function from the original config.
 * `capture` snapshots callbacks within one named field, such as advertising.
 * @internal
 */
export class NativeConfigSerializer {
  private readonly handlers: ((args: any[]) => any)[] = [];
  readonly dispatcher = new NativeCallbacks((token, args) =>
    this.handlers[Number(token)]?.(args)
  );

  serialize(config: any, { capture }: { capture?: string } = {}): any {
    return this.serializeValue(config, () => config, false, capture);
  }

  private serializeValue(
    entry: any,
    read: () => any,
    captured: boolean,
    capture?: string
  ): any {
    if (Array.isArray(entry))
      return entry.map((item, index) =>
        this.serializeField(index, item, read, captured)
      );
    if (entry != null && typeof entry === 'object') {
      return Object.fromEntries(
        Object.entries(entry).map(([key, value]) => [
          key,
          this.serializeField(key, value, read, captured || key === capture),
        ])
      );
    }
    return entry;
  }

  private serializeField(
    key: string | number,
    value: any,
    read: () => any,
    captured: boolean
  ): any {
    if (typeof value !== 'function')
      return this.serializeValue(value, () => read()?.[key], captured);

    const handler = captured
      ? (args: any[]) => value(...args)
      : (args: any[]) => {
          const owner = read();
          const handler = owner?.[key];
          return typeof handler === 'function'
            ? handler.apply(owner, args)
            : null;
        };
    // String indices share the transport used by named UI callbacks.
    return String(this.handlers.push(handler) - 1);
  }
}
