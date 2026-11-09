import * as Crypto from 'expo-crypto';
import type { SharedObject } from 'expo-modules-core/types';
import type { NativeInstanceRegistry } from './nativeInstanceRegistry';

export interface NativeInstanceConfig {
  /**
   * Optionally user-defined string `id` for the native instance.
   * Used to access a certain native instance from any point in the source code then call
   * methods/properties on it.
   *
   * @defaultValue A generated UUIDv4.
   * @example
   * Accessing or creating the `Player` with `nativeId` equal to `my-player`:
   * ```
   * const player = new Player({ nativeId: 'my-player' })
   * player.play(); // call methods and properties...
   * ```
   */
  nativeId?: string;
}

/** Only preserves backward-compatible nativeId-based construction. */
export default abstract class NativeInstance<T extends SharedObject> {
  /** User-defined compatibility ID, or a generated UUIDv4. */
  readonly nativeId: string;

  /** @internal */
  readonly native: Promise<T>;

  constructor(
    nativeId: string | undefined,
    registry: NativeInstanceRegistry<T>,
    create: () => Promise<T>
  ) {
    this.nativeId = nativeId ?? Crypto.randomUUID();
    this.native =
      nativeId == null
        ? registry.register(this.nativeId, create)
        : registry.getOrCreate(nativeId, create);
  }
}
