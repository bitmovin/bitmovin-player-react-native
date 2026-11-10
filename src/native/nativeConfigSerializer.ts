import { NativeCallbacks } from './nativeCallbacks';

/** @internal */
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
