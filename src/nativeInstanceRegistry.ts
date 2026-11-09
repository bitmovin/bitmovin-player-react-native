import type { SharedObject } from 'expo-modules-core/types';

/** Legacy IDs live only here; native methods receive SharedObjects. @internal */
type Entry = WeakRef<SharedObject> | Promise<SharedObject>;
const instances = new Map<string, Map<string, Entry>>();

function entry(
  kind: string,
  nativeId: string
): SharedObject | Promise<SharedObject> | undefined {
  const entries = instances.get(kind);
  const value = entries?.get(nativeId);
  if (!(value instanceof WeakRef)) return value;
  const instance = value.deref();
  if (!instance) {
    entries!.delete(nativeId);
    if (entries!.size === 0) instances.delete(kind);
  }
  return instance;
}

function store(
  kind: string,
  nativeId: string,
  value: SharedObject | Promise<SharedObject>
): void {
  let entries = instances.get(kind);
  if (!entries) instances.set(kind, (entries = new Map()));
  // Prune collected labels during registration without timers or finalizers.
  for (const [id, reference] of entries) {
    if (reference instanceof WeakRef && !reference.deref()) entries.delete(id);
  }
  entries.set(nativeId, value instanceof Promise ? value : new WeakRef(value));
}

/** @internal */
export function lookup<T extends SharedObject>(
  kind: string,
  nativeId: string
): T | undefined {
  const value = entry(kind, nativeId);
  return value instanceof Promise ? undefined : (value as T | undefined);
}

/** @internal */
export function getOrCreateAsync<T extends SharedObject>(
  kind: string,
  nativeId: string,
  factory: () => Promise<T>
): Promise<T> {
  const existing = entry(kind, nativeId);
  if (existing) return Promise.resolve(existing as T | Promise<T>);
  const creation = Promise.resolve()
    .then(factory)
    .then(
      (instance) => {
        if (entry(kind, nativeId) === creation) store(kind, nativeId, instance);
        return instance;
      },
      (error) => {
        remove(kind, nativeId, creation);
        throw error;
      }
    );
  store(kind, nativeId, creation);
  return creation;
}

/** A stale alias cannot remove a replacement. @internal */
export function remove(
  kind: string,
  nativeId: string,
  expected: SharedObject | Promise<SharedObject>
): boolean {
  if (entry(kind, nativeId) !== expected) return false;
  const entries = instances.get(kind)!;
  entries.delete(nativeId);
  if (entries.size === 0) instances.delete(kind);
  return true;
}
