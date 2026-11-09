import type { SharedObject } from 'expo-modules-core/types';

/**
 * Keeps JS ownership links without keeping their owners alive:
 * - Public wrapper -> resolved SharedObject, for isInitialized and legacy ID cleanup.
 * - NativePlayer's JS object -> loaded Source/offline JS object and its callbacks.
 *
 * Weak keys let callback capture cycles be collected. Native code holds only
 * weak forwarding callbacks, so the loaded JS object must retain its dispatcher.
 * The loaded-object link is replaced on load and cleared on unload or Player destruction.
 */
class NativeOwner {
  private readonly owners = new WeakMap<object, SharedObject>();

  get<T extends SharedObject>(owner: object): T | undefined {
    return this.owners.get(owner) as T | undefined;
  }

  set(owner: object, native?: SharedObject): void {
    if (native) this.owners.set(owner, native);
    else this.owners.delete(owner);
  }
}

/** @internal */
export const nativeOwner = new NativeOwner();
