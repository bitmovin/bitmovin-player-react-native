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

// A named backend can outlive its original TS wrapper. Keep its configuration
// objects alive with it, and close them when any alias destroys that backend.
const dependencies = Symbol('native dependencies');
type Dependency = { destroy(): void | Promise<void> };
type Owner = { [dependencies]?: Dependency[] };

/** @internal */
export function holdDependencies(
  owner: object,
  values: (Dependency | undefined)[]
): void {
  const target = owner as Owner;
  if (!target[dependencies])
    Object.defineProperty(target, dependencies, {
      value: [],
      configurable: true,
    });
  for (const value of values) {
    if (value && !target[dependencies]!.includes(value))
      target[dependencies]!.push(value);
  }
}

/** @internal */
export function destroyDependencies(owner: object): void {
  const target = owner as Owner;
  const values = target[dependencies];
  delete target[dependencies];
  for (const value of values ?? []) void value.destroy();
}
