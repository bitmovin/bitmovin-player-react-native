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
  } catch {
    // A late completion may already have been released.
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

const configurationFields = new Set([
  'playerConfig',
  'sourceConfig',
  'castSourceConfig',
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
export function serializeNativeConfig(value: any): any {
  const serialize = (entry: any, configuration: boolean): any => {
    if (typeof entry === 'function') return true;
    if (Array.isArray(entry))
      return entry.map((item) => serialize(item, false));
    if (entry != null && typeof entry === 'object') {
      return Object.fromEntries(
        Object.entries(entry)
          .filter(([key]) => !configuration || key !== 'nativeId')
          .map(([key, item]) => [
            key,
            dataFields.has(key)
              ? item
              : serialize(item, configurationFields.has(key)),
          ])
      );
    }
    return entry;
  };
  return serialize(value, true);
}

/** @internal */
export function configurationCallback(
  config: any,
  { capture }: { capture?: string } = {}
): NativeCallback {
  const handlers: Record<string, (...args: any[]) => any> | undefined = capture
    ? {}
    : undefined;
  if (handlers) {
    const collect = (value: any, path: string) => {
      if (typeof value === 'function') handlers[path] = value;
      else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value))
          collect(child, path ? `${path}.${key}` : key);
      }
    };
    collect(config?.[capture!], capture!);
  }
  return createNativeCallback((path, args) => {
    if (handlers && path.startsWith(`${capture}.`)) {
      const handler = handlers[path];
      return handler?.(...args);
    }
    const keys = path.split('.');
    const key = keys.pop()!;
    const owner = keys.reduce((value, key) => value?.[key], config);
    const handler = owner?.[key];
    return typeof handler === 'function' ? handler.apply(owner, args) : null;
  });
}
