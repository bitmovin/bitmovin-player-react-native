import type { SharedObject } from 'expo-modules-core/types';
import type { NativePlayer } from './modules/PlayerModule';
import type { NativeOffline } from './offline/offlineModule';

/**
 * Backward compatibility for nativeId-based construction: wrappers created with
 * the same ID share one native object. Methods and views use their owned
 * SharedObjects directly; these registries only resolve constructor aliases.
 * @internal
 */
export class NativeInstanceRegistry<T extends SharedObject> {
  private readonly instances = new Map<string, WeakRef<T> | Promise<T>>();

  private entry(nativeId: string): T | Promise<T> | undefined {
    const value = this.instances.get(nativeId);
    if (!(value instanceof WeakRef)) return value;
    const instance = value.deref();
    if (!instance) this.instances.delete(nativeId);
    return instance;
  }

  private store(nativeId: string, value: T | Promise<T>): void {
    // Prune collected labels during registration without timers or finalizers.
    for (const [id, reference] of this.instances) {
      if (reference instanceof WeakRef && !reference.deref()) {
        this.instances.delete(id);
      }
    }
    this.instances.set(
      nativeId,
      value instanceof Promise ? value : new WeakRef(value)
    );
  }

  getOrCreate(nativeId: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.entry(nativeId);
    if (existing) return Promise.resolve(existing);
    const creation = Promise.resolve()
      .then(factory)
      .then(
        (instance) => {
          if (this.entry(nativeId) === creation) {
            this.store(nativeId, instance);
          }
          return instance;
        },
        (error) => {
          this.remove(nativeId, creation);
          throw error;
        }
      );
    this.store(nativeId, creation);
    return creation;
  }

  /** A stale alias cannot remove a replacement. */
  remove(nativeId: string, expected: T | Promise<T>): boolean {
    if (this.entry(nativeId) !== expected) return false;
    return this.instances.delete(nativeId);
  }
}

/** @internal */
export const legacyPlayerRegistry = new NativeInstanceRegistry<NativePlayer>();
/** @internal */
export const legacyOfflineRegistry =
  new NativeInstanceRegistry<NativeOffline>();
