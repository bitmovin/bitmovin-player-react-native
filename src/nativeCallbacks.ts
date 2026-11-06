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
) => void;

/** @internal */
export function createNativeCallback(
  invoke: (operation: string, args: any[]) => any
): NativeCallback {
  return (operation, args, completion) => {
    const resolve = (value: any) => {
      try {
        completion?.resolve(value ?? null);
      } catch {
        // The native operation may already have timed out or been destroyed.
      }
    };
    try {
      const value = invoke(operation, args);
      if (value != null && typeof value.then === 'function') {
        void Promise.resolve(value).then(resolve, () => resolve(null));
      } else {
        resolve(value);
      }
    } catch {
      resolve(null);
    }
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

/** @internal */
export const nativeConfig = serializeNativeConfig;
