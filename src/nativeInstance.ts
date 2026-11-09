import * as Crypto from 'expo-crypto';

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
  constructor(config: Config) {
    this.config = config;
    this.nativeId = config?.nativeId ?? Crypto.randomUUID();
  }

  /**
   * Flag indicating whether the native resources of this object have been created internally
   * .i.e `initialize` has been called.
   */
  abstract isInitialized: boolean;

  /**
   * Create the native object/resources that will be managed by this instance.
   */
  abstract initialize(): void;
}
