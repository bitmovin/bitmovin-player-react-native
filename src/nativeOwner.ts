import type { SharedObject } from 'expo-modules-core/types';

const owners = new WeakMap<object, SharedObject | SharedObject[]>();

/** @internal */
export function getNativeOwner<T extends SharedObject>(
  owner: object
): T | undefined {
  const value = owners.get(owner);
  return Array.isArray(value) ? undefined : (value as T | undefined);
}

/** @internal */
export function setNativeOwner(owner: object, native?: SharedObject): void {
  if (native) owners.set(owner, native);
  else owners.delete(owner);
}

/** Ownership references only; the native SDK remains the source of playlist state. @internal */
export function getNativeOwners(owner: object): SharedObject[] {
  const value = owners.get(owner);
  return Array.isArray(value) ? value : value ? [value] : [];
}

/** @internal */
export function setNativeOwners(owner: object, native: SharedObject[]): void {
  if (native.length) owners.set(owner, native);
  else owners.delete(owner);
}
