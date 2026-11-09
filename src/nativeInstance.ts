import * as Crypto from 'expo-crypto';
import type { SharedObject } from 'expo-modules-core/types';
import { getNativeOwner, setNativeOwner } from './nativeOwner';

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

export default abstract class NativeInstance<
  Config extends NativeInstanceConfig | undefined,
> {
  /**
   * Optionally user-defined string `id` for the native instance, or UUIDv4.
   */
  readonly nativeId: string;

  /**
   * The configuration object used to initialize this instance.
   */
  readonly config: Config;

  /**
   * Generate UUID in case the user-defined `nativeId` is empty.
   */
  constructor(
    ...[config]: undefined extends Config ? [config?: Config] : [config: Config]
  ) {
    this.config = config as Config;
    this.nativeId = config?.nativeId ?? Crypto.randomUUID();
  }

  /** Retain one eager creation attempt; callers still observe its original rejection. */
  protected retainNative<T extends SharedObject>(
    creation: Promise<T>,
    onReady?: (native: T) => void
  ): Promise<T> {
    void creation.then(
      (native) => {
        setNativeOwner(this, native);
        onReady?.(native);
      },
      () => {}
    );
    return creation;
  }

  /**
   * Whether the native creation started by the constructor has completed successfully.
   */
  get isInitialized(): boolean {
    return getNativeOwner(this) !== undefined;
  }

  /**
   * Wait for the native object/resources created by the constructor.
   */
  abstract initialize(): Promise<void>;
}
