/** Legacy IDs live only here; native methods receive SharedObjects. @internal */
const instances = new Map<string, Map<string, object>>();

function entry(kind: string, nativeId: string): object | undefined {
  return instances.get(kind)?.get(nativeId);
}

function store(kind: string, nativeId: string, value: object): void {
  let entries = instances.get(kind);
  if (!entries) instances.set(kind, (entries = new Map()));
  entries.set(nativeId, value);
}

/** @internal */
export function lookup<T extends object>(
  kind: string,
  nativeId: string
): T | undefined {
  const value = entry(kind, nativeId);
  return value instanceof Promise ? undefined : (value as T | undefined);
}

/** @internal */
export function lookupPending<T extends object>(
  kind: string,
  nativeId: string
): Promise<T> | undefined {
  const value = entry(kind, nativeId);
  return value instanceof Promise ? (value as Promise<T>) : undefined;
}

/** @internal */
export function getOrCreate<T extends object>(
  kind: string,
  nativeId: string,
  factory: () => T
): T {
  const existing = lookup<T>(kind, nativeId);
  if (existing) return existing;
  const instance = factory();
  store(kind, nativeId, instance);
  return instance;
}

/** @internal */
export function getOrCreateAsync<T extends object>(
  kind: string,
  nativeId: string,
  factory: () => Promise<T>,
  dispose: (instance: T) => void | Promise<void>
): Promise<T> {
  const existing = entry(kind, nativeId);
  if (existing) return Promise.resolve(existing as T | Promise<T>);
  const creation = Promise.resolve()
    .then(factory)
    .then(
      async (instance) => {
        if (entry(kind, nativeId) !== creation) {
          await dispose(instance);
        } else {
          store(kind, nativeId, instance);
        }
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

/** A stale alias cannot remove a replacement; canceled creations dispose their result. @internal */
export function remove(
  kind: string,
  nativeId: string,
  expected: object
): boolean {
  if (entry(kind, nativeId) !== expected) return false;
  const entries = instances.get(kind)!;
  entries.delete(nativeId);
  if (entries.size === 0) instances.delete(kind);
  return true;
}
