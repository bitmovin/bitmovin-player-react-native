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

function resolveCallback(
  completion: NativeCallbackResult | undefined,
  value: any
): void {
  try {
    completion?.resolve(value ?? null);
  } catch (error) {
    console.warn('Could not deliver the native callback result.', error);
  }
}

/** @internal */
export function createNativeCallback(
  invoke: (operation: string, args: any[]) => any
): NativeCallback {
  return (operation, args, completion, mutating = false, fallbackArgument) => {
    if (completion && fallbackArgument != null) {
      void Promise.resolve()
        .then(() => invoke(operation, args))
        .then(
          (value) =>
            resolveCallback(completion, value ?? args[fallbackArgument]),
          () => resolveCallback(completion, args[fallbackArgument])
        );
      return null;
    }
    try {
      const result = invoke(operation, args);
      const asynchronous = result != null && typeof result.then === 'function';
      const value =
        mutating && !asynchronous
          ? {
              ...args[0],
              ...(result && typeof result === 'object' ? result : {}),
            }
          : result;
      if (!completion) {
        if (asynchronous) {
          // SDK decisions are synchronous; consume unexpected Promise failures.
          void Promise.resolve(value).catch(() => {});
          return null;
        }
        return value ?? null;
      }
      if (asynchronous) {
        void Promise.resolve(value).then(
          (result) => resolveCallback(completion, result),
          () => resolveCallback(completion, null)
        );
      } else {
        resolveCallback(completion, value);
      }
    } catch {
      resolveCallback(completion, null);
    }
    return null;
  };
}

const callbackOwner = Symbol('callbackOwner');

// This scope receives only the WeakRef, so the native function cannot retain the dispatcher.
/** @internal */
export function weakNativeCallback(
  reference: WeakRef<NativeCallback>
): NativeCallback {
  return (operation, args, completion, mutating, fallbackArgument) => {
    const callback = reference.deref();
    if (callback)
      return callback(operation, args, completion, mutating, fallbackArgument);
    resolveCallback(
      completion,
      fallbackArgument == null ? null : args[fallbackArgument]
    );
    return null;
  };
}

/** @internal */
export async function createSharedObjectWithCallback<T extends SharedObject>(
  create: (callback: NativeCallback) => Promise<T>,
  callback: NativeCallback
): Promise<T> {
  const native = await create(weakNativeCallback(new WeakRef(callback)));
  Object.defineProperty(native, callbackOwner, { value: callback });
  return native;
}

const configurationFields = new Set([
  'playerConfig',
  'sourceConfig',
  'networkConfig',
  'decoderConfig',
  'drmConfig',
  'playbackConfig',
  'analyticsConfig',
]);
const dataFields = new Set([
  'metadata',
  'defaultMetadata',
  'customData',
  'headers',
  'httpHeaders',
  'licenseRequestHeaders',
  'certificateRequestHeaders',
]);

/** @internal */
export function createConfigurationCallbacks() {
  const handlers: ((args: any[]) => any)[] = [];
  return {
    callback: createNativeCallback((token, args) =>
      handlers[Number(token)]?.(args)
    ),
    serialize(config: any, { capture }: { capture?: string } = {}): any {
      const serialize = (
        entry: any,
        configuration: boolean,
        read: () => any,
        captured = false
      ): any => {
        const field = (
          key: string | number,
          value: any,
          configuration: boolean
        ): any => {
          const snapshot = captured || (entry === config && key === capture);
          if (typeof value === 'function') {
            const handler = snapshot
              ? (args: any[]) => value(...args)
              : (args: any[]) => {
                  const owner = read();
                  const handler = owner?.[key];
                  return typeof handler === 'function'
                    ? handler.apply(owner, args)
                    : null;
                };
            // String indices share the transport used by named UI callbacks.
            return String(handlers.push(handler) - 1);
          }
          return serialize(value, configuration, () => read()?.[key], snapshot);
        };
        if (Array.isArray(entry))
          return entry.map((item, index) => field(index, item, false));
        if (entry != null && typeof entry === 'object') {
          return Object.fromEntries(
            Object.entries(entry)
              .filter(([key]) => !configuration || key !== 'nativeId')
              .map(([key, item]) => [
                key,
                dataFields.has(key)
                  ? item
                  : field(key, item, configurationFields.has(key)),
              ])
          );
        }
        return entry;
      };
      return serialize(config, true, () => config);
    },
  };
}
