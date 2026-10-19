import type { AdvertisingConfig } from './advertising';
import type { AnalyticsConfig } from './analytics';
import type { StyleConfig } from './styleConfig';
import type { TweaksConfig } from './tweaksConfig';
import type { AdaptationConfig } from './adaptationConfig';
import type { RemoteControlConfig } from './remoteControlConfig';
import type { BufferConfig } from './bufferConfig';
import type { NativeInstanceConfig } from './nativeInstance';
import type { PlaybackConfig } from './playbackConfig';
import type { LiveConfig } from './liveConfig';
import type { NetworkConfig } from './network/networkConfig';
import type { MediaControlConfig } from './mediaControlConfig';

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
  /**
   * Configures network request manipulation functionality. A default {@link NetworkConfig} is set initially.
   */
  networkConfig?: NetworkConfig;
  /**
   * Configures the media control information for the application. This information will be displayed
   * wherever current media information typically appears, such as the lock screen, in notifications,
   * and inside the control center.
   */
  mediaControlConfig?: MediaControlConfig;
}
