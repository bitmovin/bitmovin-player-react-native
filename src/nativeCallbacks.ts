import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';

// Registers the native class used for one invocation's completion value.
void requireNativeModule('NativeCallbacksModule').CallbackResult;

/** @internal */
export interface NativeCallbackResult {
  resolve(value: any): void;
}

/** @internal */
export type NativeCallback = (
  operation: string,
  args: any[],
  completion?: NativeCallbackResult,
  mutating?: boolean,
  fallbackArgument?: number
) => any;

const callbackOwner = Symbol('callbackOwner');

/** @internal */
export class NativeCallbacks {
  constructor(
    private readonly invoke: (operation: string, args: any[]) => any
  ) {}

  readonly callback: NativeCallback = (
    operation,
    args,
    completion,
    mutating = false,
    fallbackArgument
  ) => {
    if (completion) {
      void this.complete(operation, args, completion, fallbackArgument);
      return null;
    }
    try {
      const result = this.invoke(operation, args);
      if (result != null && typeof result.then === 'function') {
        // SDK decisions are synchronous; consume unexpected Promise failures.
        void Promise.resolve(result).catch(() => {});
        return null;
      }
      return mutating
        ? {
            ...args[0],
            ...(result && typeof result === 'object' ? result : {}),
          }
        : (result ?? null);
    } catch {
      return null;
    }
  };

  weak(): NativeCallback {
    return NativeCallbacks.forward(new WeakRef(this));
  }

  async create<T extends SharedObject>(
    create: (callback: NativeCallback) => Promise<T>
  ): Promise<T> {
    const native = await create(this.weak());
    Object.defineProperty(native, callbackOwner, { value: this });
    return native;
  }

  private async complete(
    operation: string,
    args: any[],
    completion: NativeCallbackResult,
    fallbackArgument?: number
  ): Promise<void> {
    // Network preprocessing has always invoked customer callbacks on a later microtask.
    await Promise.resolve();
    let value = fallbackArgument == null ? null : args[fallbackArgument];
    try {
      value = (await this.invoke(operation, args)) ?? value;
    } catch {
      // Failed network preprocessing forwards the original request or response.
    }
    NativeCallbacks.resolve(completion, value);
  }

  // This static scope captures only the WeakRef, never the callback owner.
  private static forward(reference: WeakRef<NativeCallbacks>): NativeCallback {
    return (operation, args, completion, mutating, fallbackArgument) => {
      const callbacks = reference.deref();
      if (callbacks)
        return callbacks.callback(
          operation,
          args,
          completion,
          mutating,
          fallbackArgument
        );
      NativeCallbacks.resolve(
        completion,
        fallbackArgument == null ? null : args[fallbackArgument]
      );
      return null;
    };
  }

  private static resolve(
    completion: NativeCallbackResult | undefined,
    value: any
  ): void {
    try {
      completion?.resolve(value ?? null);
    } catch (error) {
      console.warn('Could not deliver the native callback result.', error);
    }
  }
}

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
