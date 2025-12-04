import { PlayerViewEvents } from './events';
import { Player } from '../../player';
import { FullscreenHandler, CustomMessageHandler } from '../../ui';
import { ScalingMode } from '../../styleConfig';
import { ViewStyle } from 'react-native';
import { PlayerViewConfig } from './playerViewConfig';
import { PictureInPictureAction } from './pictureInPictureAction';
import { RefObject } from 'react';

/**
 * Base `PlayerView` component props.
 * Used to establish common props between `NativePlayerView` and {@link PlayerView}.
 */
export interface BasePlayerViewProps {
  ref?: RefObject<null>;
  /**
   * The {@link FullscreenHandler} that is used by the {@link PlayerView} to control the fullscreen mode.
   */
  fullscreenHandler?: FullscreenHandler;

  /**
   * The {@link CustomMessageHandler} that can be used to directly communicate with the embedded Bitmovin Web UI.
   */
  customMessageHandler?: CustomMessageHandler;

  /**
   * Can be set to `true` to request fullscreen mode, or `false` to request exit of fullscreen mode.
   * Should not be used to get the current fullscreen state. Use {@link PlayerViewEvents.onFullscreenEnter} and {@link PlayerViewEvents.onFullscreenExit}
   * or the {@link FullscreenHandler.isFullscreenActive} property to get the current state.
   * Using this property to change the fullscreen state, it is ensured that the embedded Player UI is also aware
   * of potential fullscreen state changes.
   * To use this property, a {@link FullscreenHandler} must be set.
   */
  isFullscreenRequested?: boolean;

  /**
   * A value defining how the video is displayed within the parent container's bounds.
   * Possible values are defined in {@link ScalingMode}.
   */
  scalingMode?: ScalingMode;

  /**
   * Can be set to `true` to request Picture in Picture mode, or `false` to request exit of Picture in Picture mode.
   * Should not be used to get the current Picture in Picture state. Use {@link PlayerViewEvents.onPictureInPictureEnter} and {@link PlayerViewEvents.onPictureInPictureExit}.
   */
  isPictureInPictureRequested?: boolean;

  /**
   * Style of the {@link PlayerView}.
   */
  style?: ViewStyle;

  /**
   * Configures the visual presentation and behaviour of the {@link PlayerView}.
   * The value must not be altered after setting it initially.
   */
  config?: PlayerViewConfig;

  /**
   * Picture in Picture actions that should be displayed on the Picture in Picture window.
   *
   * Limitations:
   * - On Android if an empty list is passed and {@link MediaControlConfig.isEnabled} is set to true
   * play, pause, next, and previous controls will appear, due to the default Android Picture in Picture implementation:
   * https://developer.android.com/develop/ui/views/picture-in-picture#add_controls
   * Set {@link MediaControlConfig.isEnabled} to false if this is
   * not the desired behaviour.
   * - on iOS/tvOS if {@link PictureInPictureAction.TogglePlayback} is not specified also other actions are
   * disabled due to OS limitations.
   *
   * Default value is `undefined`, which translates to:
   * - Android: No actions, unless {@link MediaControlConfig.isEnabled} is set to true
   * - iOS: All actions enabled
   */
  pictureInPictureActions?: PictureInPictureAction[];
}

/**
 * {@link PlayerView} component props.
 */
export interface PlayerViewProps extends BasePlayerViewProps, PlayerViewEvents {
  viewRef?: RefObject<any>;
  /**
   * {@link Player} instance (generally returned from {@link usePlayer} hook) that will control
   * and render audio/video inside the {@link PlayerView}.
   */
  player: Player;
}
