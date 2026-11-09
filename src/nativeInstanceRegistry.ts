import type { SharedObject } from 'expo-modules-core/types';
import type { NativePlayer } from './modules/PlayerModule';
import type { NativeOffline } from './offline/offlineModule';

/**
 * Backward compatibility for nativeId-based construction: wrappers created with
 * the same ID share one native object. Methods and views use their owned
 * SharedObjects directly; these registries only resolve constructor aliases.
 * Pending creations share one Promise; completed entries hold only a WeakRef.
 * @internal
 */
export class NativeInstanceRegistry<T extends SharedObject> {
  private readonly instances = new Map<string, WeakRef<T> | Promise<T>>();

  getOrCreate(nativeId: string, factory: () => Promise<T>): Promise<T> {
    const entry = this.instances.get(nativeId);
    const existing = entry instanceof WeakRef ? entry.deref() : entry;
    if (existing) return Promise.resolve(existing);

    // Prune collected labels without timers or finalizers.
    for (const [id, reference] of this.instances) {
      if (reference instanceof WeakRef && !reference.deref()) {
        this.instances.delete(id);
      }
    }

    const createInstance = async (): Promise<T> => {
      // The wrapper's constructor must finish initializing before its factory runs.
      await Promise.resolve();
      try {
        const instance = await factory();
        if (this.instances.get(nativeId) === creation) {
          this.instances.set(nativeId, new WeakRef(instance));
        }
        return instance;
      } catch (error) {
        this.remove(nativeId, creation);
        throw error;
      }
    };
    const creation = createInstance();
    this.instances.set(nativeId, creation);
    return creation;
  }

  /** A stale alias cannot remove a replacement. */
  remove(nativeId: string, expected: T | Promise<T>): boolean {
    const entry = this.instances.get(nativeId);
    const existing = entry instanceof WeakRef ? entry.deref() : entry;
    if (existing !== expected) return false;
    return this.instances.delete(nativeId);
  }
}

/** @internal */
export const legacyPlayerRegistry = new NativeInstanceRegistry<NativePlayer>();
/** @internal */
export const legacyOfflineRegistry =
  new NativeInstanceRegistry<NativeOffline>();
