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

/** Backward-compatible construction identity. */
export default abstract class NativeInstance<T extends SharedObject> {
  /** User-defined compatibility ID, or a generated UUIDv4. */
  readonly nativeId: string;

  /** @internal */
  abstract readonly native: Promise<T>;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Crypto.randomUUID();
  }

  /** Call after the concrete wrapper has initialized its fields. */
  protected registerNative(
    nativeId: string | undefined,
    registry: NativeInstanceRegistry<T>,
    create: () => Promise<T>
  ): Promise<T> {
    return nativeId == null
      ? registry.register(this.nativeId, create)
      : registry.getOrCreate(nativeId, create);
  }
}
