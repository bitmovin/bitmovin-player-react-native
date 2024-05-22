import { AdvertisingConfig } from './advertising';
import { AnalyticsConfig } from './analytics';
import { StyleConfig } from './styleConfig';
import { TweaksConfig } from './tweaksConfig';
import { AdaptationConfig } from './adaptationConfig';
import { RemoteControlConfig } from './remoteControlConfig';
import { BufferConfig } from './bufferConfig';
import { NativeInstanceConfig } from './nativeInstance';
import { PlaybackConfig } from './playbackConfig';
import { LiveConfig } from './liveConfig';
import { NetworkConfig } from './network/networkConfig';

/**
 * Object used to configure a new `Player` instance.
 */
export interface PlayerConfig extends NativeInstanceConfig {
  /**
   * Bitmovin license key that can be found in the Bitmovin portal.
   * If a license key is set here, it will be used instead of the license key found in the `Info.plist` and `AndroidManifest.xml`.
   * @example
   * Configuring the player license key from source code:
   * ```
   * const player = new Player({
   *   licenseKey: '\<LICENSE-KEY-CODE\>',
   * });
   * ```
   * @example
   * `licenseKey` can be safely omitted from source code if it has
   * been configured in Info.plist/AndroidManifest.xml.
   * ```
   * const player = new Player(); // omit `licenseKey`
   * player.play(); // call methods and properties...
   * ```
   */
  licenseKey?: string;
  /**
   * Configures playback behaviour. A default {@link PlaybackConfig} is set initially.
   */
  playbackConfig?: PlaybackConfig;
  /**
   * Configures the visual presentation and behaviour of the player UI. A default {@link StyleConfig} is set initially.
   */
  styleConfig?: StyleConfig;
  /**
   * Configures advertising functionality. A default {@link AdvertisingConfig} is set initially.
   */
  advertisingConfig?: AdvertisingConfig;
  /**
   * Configures experimental features. A default {@link TweaksConfig} is set initially.
   */
  tweaksConfig?: TweaksConfig;
  /**
   * Configures analytics functionality.
   */
  analyticsConfig?: AnalyticsConfig;
  /**
   * Configures adaptation logic.
   */
  adaptationConfig?: AdaptationConfig;
  /**
   * Configures remote playback functionality.
   */
  remoteControlConfig?: RemoteControlConfig;
  /**
   * Configures buffer settings. A default {@link BufferConfig} is set initially.
   */
  bufferConfig?: BufferConfig;
  /**
   * Configures behaviour when playing live content. A default {@link LiveConfig} is set initially.
   */
  liveConfig?: LiveConfig;

  networkConfig?: NetworkConfig;
}
