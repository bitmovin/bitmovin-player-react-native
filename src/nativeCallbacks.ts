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
  completion?: NativeCallbackResult
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
  return (operation, args, completion) => {
    try {
      const value = invoke(operation, args);
      const asynchronous = value != null && typeof value.then === 'function';
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
export function nativeCallback(
  handlers: Record<string, ((...args: any[]) => any) | undefined>
): NativeCallback {
  return createNativeCallback((operation, args) => {
    const handler = handlers[operation];
    return handler?.(...args);
  });
}
