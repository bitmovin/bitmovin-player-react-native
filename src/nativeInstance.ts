import * as Crypto from 'expo-crypto';
import type { SharedObject } from 'expo-modules-core/types';
import type { NativeInstanceRegistry } from './nativeInstanceRegistry';

export interface NativeInstanceConfig {
  /**
   * Legacy identifier for constructing wrappers that share one native object.
   *
   * @deprecated Retain and reuse the Player or OfflineContentManager instance instead of constructing aliases by ID. Kept only for backward compatibility.
   * @defaultValue A generated UUIDv4.
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
