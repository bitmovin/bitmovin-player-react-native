import { PlayerViewEvents } from './events';
import { Player } from '../../player';
import { FullscreenHandler, CustomMessageHandler } from '../../ui';
import { ScalingMode } from '../../styleConfig';
import { PictureInPictureConfig } from './pictureInPictureConfig';
import { ViewStyle } from 'react-native';
import { PlayerViewConfig } from './playerViewConfig';

/**
 * Base `PlayerView` component props.
 * Used to establish common props between {@link NativePlayerView} and {@link PlayerView}.
 */
export interface BasePlayerViewProps {
  /**
   * The {@link FullscreenHandler} that is used by the `PlayerView` to control the fullscreen mode.
   */
  fullscreenHandler?: FullscreenHandler;

  /**
   * The {@link CustomMessageHandler} that can be used to directly communicate with the embedded Bitmovin Web UI.
   */
  customMessageHandler?: CustomMessageHandler;

  /**
   * Style of the {@link PlayerView}.
   */
  style?: ViewStyle;

  /**
   * Provides options to configure Picture in Picture playback.
   */
  pictureInPictureConfig?: PictureInPictureConfig;

  /**
   * Configures the visual presentation and behaviour of the {@link PlayerView}.
   * The value must not be altered after setting it initially.
   */
  config?: PlayerViewConfig;
}

/**
 * `PlayerView` component props.
 * @see PlayerView
 */
export interface PlayerViewProps extends BasePlayerViewProps, PlayerViewEvents {
  /**
   * `Player` instance (generally returned from `usePlayer` hook) that will control
   * and render audio/video inside the `PlayerView`.
   */
  player: Player;

  /**
   * Can be set to `true` to request fullscreen mode, or `false` to request exit of fullscreen mode.
   * Should not be used to get the current fullscreen state. Use `onFullscreenEnter` and `onFullscreenExit`
   * or the `FullscreenHandler.isFullscreenActive` property to get the current state.
   * Using this property to change the fullscreen state, it is ensured that the embedded Player UI is also aware
   * of potential fullscreen state changes.
   * To use this property, a `FullscreenHandler` must be set.
   */
  isFullscreenRequested?: Boolean;

  /**
   * A value defining how the video is displayed within the parent container's bounds.
   * Possible values are defined in `ScalingMode`.
   */
  scalingMode?: ScalingMode;

  /**
   * Can be set to `true` to request Picture in Picture mode, or `false` to request exit of Picture in Picture mode.
   * Should not be used to get the current Picture in Picture state. Use `onPictureInPictureEnter` and `onPictureInPictureExit.
   */
  isPictureInPictureRequested?: Boolean;
}
