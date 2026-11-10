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

/**
 * Dispatches native calls to JavaScript and delivers their results.
 * Wraps synchronous and asynchronous SharedObject factories with weak callbacks.
 * @internal
 */
export class NativeCallbacks {
  constructor(
    private readonly invoke: (operation: string, args: any[]) => any
  ) {}

  private readonly callback: NativeCallback = (
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

  create<T extends SharedObject>(create: (callback: NativeCallback) => T): T {
    return this.attach(create(this.weak()));
  }

  async createAsync<T extends SharedObject>(
    create: (callback: NativeCallback) => Promise<T>
  ): Promise<T> {
    return this.attach(await create(this.weak()));
  }

  private attach<T extends SharedObject>(native: T): T {
    return Object.defineProperty(native, callbackOwner, { value: this });
  }

  private weak(): NativeCallback {
    return NativeCallbacks.forward(new WeakRef(this));
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
