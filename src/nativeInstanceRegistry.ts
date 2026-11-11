import * as Crypto from 'expo-crypto';
import type { SharedObject } from 'expo-modules-core/types';
import type { NativePlayer } from './modules/playerModule';
import type { NativeOffline } from './offline/offlineModule';

export interface NativeInstanceConfig {
  /**
   * Legacy identifier for constructing wrappers that share one native object.
   *
   * @deprecated Retain and reuse the Player or OfflineContentManager instance instead of constructing aliases by ID. Kept only for backward compatibility.
   * @defaultValue A generated UUIDv4.
   */
  nativeId?: string;
}

/**
 * Backward compatibility for nativeId-based construction: live wrappers created with
 * the same ID share one native object. Methods and views use their owned
 * SharedObjects directly; these registries only resolve constructor aliases.
 * Each wrapper owns its fixed creation Promise; the registry references it weakly.
 * @internal
 */
export class NativeInstanceRegistry<T extends SharedObject> {
  private readonly instances = new Map<string, WeakRef<Promise<T>>>();

  create(
    nativeId: string | undefined,
    factory: () => Promise<T>
  ): { nativeId: string; native: Promise<T> } {
    const id = nativeId ?? Crypto.randomUUID();
    const cached =
      nativeId == null ? undefined : this.instances.get(nativeId)?.deref();
    const native = cached ?? this.register(id, factory());
    return { nativeId: id, native };
  }

  /** Register a new ID directly, without looking for an existing alias. */
  private register(nativeId: string, creation: Promise<T>): Promise<T> {
    for (const [id, reference] of this.instances) {
      if (!reference.deref()) this.instances.delete(id);
    }
    this.instances.set(nativeId, new WeakRef(creation));
    void creation.catch(() => this.remove(nativeId, creation));
    return creation;
  }

  /**
   * The caller passes its native creation Promise. After destruction, the ID may
   * belong to a new wrapper while an old alias still holds the original Promise.
   */
  remove(nativeId: string, creation: Promise<T>): boolean {
    if (this.instances.get(nativeId)?.deref() !== creation) return false;
    return this.instances.delete(nativeId);
  }
}

/** @internal */
export const legacyPlayerRegistry = new NativeInstanceRegistry<NativePlayer>();
/** @internal */
// prettier-ignore
export const legacyOfflineRegistry = new NativeInstanceRegistry<NativeOffline>();
