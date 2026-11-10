import type { SharedObject } from 'expo-modules-core/types';
import type { NativePlayer } from './modules/PlayerModule';
import type { NativeSource } from './modules/SourceModule';
import type { NativeOffline } from './offline/offlineModule';

/**
 * Keeps a JS SharedObject dependency alive while its owner remains reachable.
 * Weak keys let callback capture cycles be collected; the global instances do
 * not keep owners alive. Native forwarding callbacks reference their dispatchers weakly.
 */
class NativeOwner<Owner extends SharedObject, Native extends SharedObject> {
  private readonly owners = new WeakMap<Owner, Native>();

  get(owner: Owner): Native | undefined {
    return this.owners.get(owner);
  }

  set(owner: Owner, native?: Native): void {
    if (native) this.owners.set(owner, native);
    else this.owners.delete(owner);
  }
}

/** Keeps loaded Source callbacks reachable across Player aliases. @internal */
export const playerSourceOwner = new NativeOwner<NativePlayer, NativeSource>();
/** Keeps offline Source callbacks reachable through the manager's JS backend. @internal */
// prettier-ignore
export const playerOfflineOwner = new NativeOwner<NativePlayer, NativeOffline>();
