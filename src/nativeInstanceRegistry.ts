import * as Crypto from 'expo-crypto';
import type { Player } from './player';
import type { OfflineContentManager } from './offline/offlineContentManager';

export interface NativeInstanceConfig {
  /**
   * Legacy identifier for constructing wrappers that share one native object.
   *
   * @deprecated Retain and reuse the Player or OfflineContentManager instance instead of constructing aliases by ID. Kept only for backward compatibility.
   * @defaultValue A generated UUIDv4.
   */
  nativeId?: string;
}

/** Compatibility labels resolve directly to public native objects. @internal */
export class NativeInstanceRegistry<T extends object> {
  private readonly instances = new Map<string, WeakRef<T>>();
  get(nativeId: string | undefined): T | undefined {
    return nativeId == null ? undefined : this.instances.get(nativeId)?.deref();
  }
  register(nativeId: string | undefined, owner: T): string {
    const id = nativeId ?? Crypto.randomUUID();
    for (const [key, reference] of this.instances)
      if (!reference.deref()) this.instances.delete(key);
    this.instances.set(id, new WeakRef(owner));
    return id;
  }
  remove(nativeId: string, owner: T): boolean {
    return this.get(nativeId) === owner && this.instances.delete(nativeId);
  }
}
/** @internal */
export const legacyPlayerRegistry = new NativeInstanceRegistry<Player>();
/** @internal */
export const legacyOfflineRegistry =
  new NativeInstanceRegistry<OfflineContentManager>();
