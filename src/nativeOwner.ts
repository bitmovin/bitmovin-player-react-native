import type { SharedObject } from 'expo-modules-core/types';

const owners = new WeakMap<object, SharedObject>();

/** @internal */
export function getNativeOwner<T extends SharedObject>(
  owner: object
): T | undefined {
  return owners.get(owner) as T | undefined;
}

/** @internal */
export function setNativeOwner(owner: object, native?: SharedObject): void {
  if (native) owners.set(owner, native);
  else owners.delete(owner);
}
