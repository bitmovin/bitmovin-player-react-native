import type { SharedObject } from 'expo-modules-core/types';
import type { NativePlayer } from './modules/PlayerModule';
import type { NativeOffline } from './offline/offlineModule';

/**
 * Backward compatibility for nativeId-based construction: live wrappers created with
 * the same ID share one native object. Methods and views use their owned
 * SharedObjects directly; these registries only resolve constructor aliases.
 * Each wrapper owns its fixed creation Promise; the registry references it weakly.
 * @internal
 */
export class NativeInstanceRegistry<T extends SharedObject> {
  private readonly instances = new Map<string, WeakRef<Promise<T>>>();

  getOrCreate(nativeId: string, factory: () => Promise<T>): Promise<T> {
    return (
      this.instances.get(nativeId)?.deref() ?? this.register(nativeId, factory)
    );
  }

  /** Register a new ID directly, without looking for an existing alias. */
  register(nativeId: string, factory: () => Promise<T>): Promise<T> {
    for (const [id, reference] of this.instances) {
      if (!reference.deref()) this.instances.delete(id);
    }
    const creation = (async () => {
      // Registration runs inside super(); the concrete wrapper's fields are not ready yet.
      await Promise.resolve();
      return factory();
    })();
    this.instances.set(nativeId, new WeakRef(creation));
    void creation.catch(() => this.remove(nativeId, creation));
    return creation;
  }

  /** A stale alias cannot remove a replacement. */
  remove(nativeId: string, expected: Promise<T>): boolean {
    if (this.instances.get(nativeId)?.deref() !== expected) return false;
    return this.instances.delete(nativeId);
  }
}

/** @internal */
export const legacyPlayerRegistry = new NativeInstanceRegistry<NativePlayer>();
/** @internal */
export const legacyOfflineRegistry =
  new NativeInstanceRegistry<NativeOffline>();
