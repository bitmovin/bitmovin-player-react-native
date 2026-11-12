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

/**
 * Dispatches configuration callbacks through a weak native forwarder
 * to avoid strong reference loops. Synchronous SDK decisions return immediately;
 * only asynchronous replies use a per-call completion object.
 *
 * Keep the dispatcher in an owner's readonly field for its callback lifetime:
 * ```ts
 * this.callbacks = new NativeCallbacks((operation, args) => handlers[operation](...args));
 * this.native = new NativeOwner(config, this.callbacks.callback);
 * ```
 * Native code retains the forwarder, which holds only a WeakRef to this dispatcher.
 * Releasing the owner therefore does not create a native-to-JavaScript strong cycle.
 * @internal
 */
export class NativeCallbacks {
  constructor(
    private readonly invoke: (operation: string, args: any[]) => any
  ) {}

  get callback(): NativeCallback {
    return NativeCallbacks.forward(new WeakRef(this));
  }

  private readonly invokeCallback: NativeCallback = (
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
    return this.synchronous(operation, args, mutating);
  };

  private synchronous(operation: string, args: any[], mutating: boolean): any {
    try {
      const result = this.invoke(operation, args);
      if (result != null && typeof result.then === 'function') {
        // SDK decisions cannot wait for a Promise; consume rejected results.
        void Promise.resolve(result).catch(() => {});
        return null;
      }
      if (!mutating) return result ?? null;
      return {
        ...args[0],
        ...(result && typeof result === 'object' ? result : {}),
      };
    } catch {
      return null;
    }
  }

  private async complete(
    operation: string,
    args: any[],
    completion: NativeCallbackResult,
    fallbackArgument?: number
  ): Promise<void> {
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
        return callbacks.invokeCallback(
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
