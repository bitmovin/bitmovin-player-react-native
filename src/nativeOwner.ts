// State for ID-free TS wrappers. Weak keys do not retain abandoned wrappers.
const owners = new WeakMap<object, object>();

/** @internal */
export function getNativeOwner<T extends object>(owner: object): T | undefined {
  return owners.get(owner) as T | undefined;
}

/** @internal */
export function setNativeOwner(owner: object, native?: object): void {
  if (native) owners.set(owner, native);
  else owners.delete(owner);
}
