import { NativeModules } from 'react-native';

const UUID = NativeModules.UUIDModule;

export interface NativeInstanceConfig {
  /**
   * Optionally user-defined string `id` for the native instance.
   * Used to access a certain native instance from any point in the source code then call
   * methods/properties on it.
   *
   * When left empty, a random `UUIDv4` is generated for it.
   * @example
   * Accessing or creating the `Player` with `nativeId` equal to `my-player`:
   * ```
   * const player = new Player({ nativeId: 'my-player' })
   * player.play(); // call methods and properties...
   * ```
   */
  nativeId?: string;
}

export default class NativeInstance<Config extends NativeInstanceConfig> {
  /**
   * Optionally user-defined string `id` for the native instance, or UUIDv4.
   */
  readonly nativeId: string;

  /**
   * The configuration object used to initialize this instance.
   */
  readonly config?: Config;

  /**
   * Generate UUID in case the user-defined `nativeId` is empty.
   */
  constructor(config?: Config) {
    this.config = config;
    this.nativeId = config?.nativeId ?? UUID.generate();
  }
}
