/**
 * Keeps legacy string IDs usable while native instances are Expo SharedObjects.
 * Entries retain native SharedObjects after explicit initialization. Public
 * wrappers with the same ID keep their own configuration and lifecycle flags.
 * @internal
 */
const instances = new Map<string, Map<string, object>>();

/** @internal */
export function lookup<T extends object>(
  kind: string,
  nativeId: string
): T | undefined {
  return instances.get(kind)?.get(nativeId) as T | undefined;
}

/** @internal */
export function getOrCreate<T extends object>(
  kind: string,
  nativeId: string,
  factory: () => T
): T {
  const existing = lookup<T>(kind, nativeId);
  if (existing) {
    return existing;
  }

  // A failed constructor must not leave an entry that prevents retrying.
  const instance = factory();
  let kindInstances = instances.get(kind);
  if (!kindInstances) {
    kindInstances = new Map();
    instances.set(kind, kindInstances);
  }
  kindInstances.set(nativeId, instance);
  return instance;
}

/**
 * Removes only the expected instance. A stale alias must not remove a replacement
 * that was created later with the same ID. Removing an entry does not release its
 * Expo association; native cleanup belongs to the public wrapper's destroy method.
 * @internal
 */
export function remove(
  kind: string,
  nativeId: string,
  expected: object
): boolean {
  const kindInstances = instances.get(kind);
  if (kindInstances?.get(nativeId) !== expected) {
    return false;
  }

  kindInstances.delete(nativeId);
  if (kindInstances.size === 0) {
    instances.delete(kind);
  }
  return true;
}
