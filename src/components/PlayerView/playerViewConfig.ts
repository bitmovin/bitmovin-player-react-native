import { PictureInPictureConfig } from './pictureInPictureConfig';

/**
 * Configures the visual presentation and behaviour of the `PlayerView`.
 */
export interface PlayerViewConfig {
  /**
   * Configures the visual presentation and behaviour of the Bitmovin Player UI.
   * A {@link WebUiConfig} can be used to configure the default Bitmovin Player Web UI.
   *
   * Default is {@link WebUiConfig}.
   *
   * Limitations:
   * Configuring the `uiConfig` only has an effect if the {@link StyleConfig.userInterfaceType} is set to {@link UserInterfaceType.Bitmovin}.
   */
  uiConfig?: UiConfig;

  /**
   * Provides options to configure Picture in Picture playback.
   */
  pictureInPictureConfig?: PictureInPictureConfig;

  /**
   * When set to `true`, the first frame of the main content will not be rendered before playback starts. Default is `false`.
   * This configuration has no effect for the {@link UserInterfaceType.Subtitle} on iOS/tvOS.
   *
   * To reliably hide the first frame before a pre-roll ad, please ensure that you are using the {@link AdvertisingConfig} to schedule ads and not the {@link Player.scheduleAd} API call.
   */
  hideFirstFrame?: boolean;

  /**
   * Specify on which surface type the video should be rendered.
   *
   * See {@link https://developer.android.com/guide/topics/media/ui/playerview#surfacetype|Choosing a surface type}
   * for more information.
   *
   * Default is {@link SurfaceType.SurfaceView}.
   *
   * @remarks Platform: Android
   */
  surfaceType?: SurfaceType;
}

/**
 * Configures the visual presentation and behaviour of the Bitmovin Player UI.
 */
export type UiConfig = object;

/**
 * Configures the visual presentation and behaviour of the Bitmovin Web UI.
 */
export interface WebUiConfig extends UiConfig {
  /**
   * Whether the Bitmovin Web UI will show playback speed selection options in the settings menu.
   * Default is `true`.
   */
  playbackSpeedSelectionEnabled?: boolean;
  /**
   * The UI variant to use for the Bitmovin Player Web UI.
   *
   * Default is {@link SmallScreenUi}
   */
  variant?: Variant;
  /**
   * Whether the WebView should be focused on initialization.
   *
   * By default this is enabled only for the TV UI variant, as it's needed there to
   * initiate spatial navigation using the remote control.
   *
   * @remarks Platform: Android
   */
  focusUiOnInitialization?: boolean;
}

export abstract class Variant {
  /**
   * Specifies the function name that will be used to initialize the `UIManager`
   * for the Bitmovin Player Web UI.
   *
   * The function is called on the `window` object with the `Player` as the first argument and
   * the `UIConfig` as the second argument.
   *
   * Example:
   * When you added a new function or want to use a different function of our `UIFactory`,
   * you can specify the full qualifier name including namespaces.
   * e.g. `bitmovin.playerui.UIFactory.buildDefaultSmallScreenUI` for the SmallScreenUi.
   * @see UIFactory https://github.com/bitmovin/bitmovin-player-ui/blob/develop/src/ts/uifactory.ts#L60
   *
   * Notes:
   * - It's not necessary to use our `UIFactory`. Any static function can be specified.
   */
  constructor(public readonly uiManagerFactoryFunction: string) {}
}

export class SmallScreenUi extends Variant {
  constructor() {
    super('bitmovin.playerui.UIFactory.buildDefaultSmallScreenUI');
  }
}

export class TvUi extends Variant {
  constructor() {
    super('bitmovin.playerui.UIFactory.buildDefaultTvUI');
  }
}

export class CustomUi extends Variant {}

/**
 * The type of surface on which to render video.
 *
 * See {@link https://developer.android.com/guide/topics/media/ui/playerview#surfacetype|Choosing a surface type}
 * for more information.
 */
export enum SurfaceType {
  /**
   * SurfaceView generally causes lower battery consumption,
   * and has better handling for HDR and secure content.
   */
  SurfaceView = 'SurfaceView',
  /** TextureView is sometime needed for smooth animations. */
  TextureView = 'TextureView',
}
