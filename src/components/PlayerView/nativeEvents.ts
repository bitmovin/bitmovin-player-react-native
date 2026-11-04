import type {
  FullscreenEnabledEvent,
  FullscreenDisabledEvent,
  FullscreenEnterEvent,
  FullscreenExitEvent,
  PictureInPictureAvailabilityChangedEvent,
  PictureInPictureEnterEvent,
  PictureInPictureEnteredEvent,
  PictureInPictureExitEvent,
  PictureInPictureExitedEvent,
} from '../../events';

/**
 * Event props for `NativePlayerView`.
 */
export type NativePlayerViewEvents = {
  /**
   * Event emitted when fullscreen mode has been enabled.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenEnabled?: (event: {
    nativeEvent: FullscreenEnabledEvent;
  }) => void;
  /**
   * Event emitted when fullscreen mode has been disabled.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenDisabled?: (event: {
    nativeEvent: FullscreenDisabledEvent;
  }) => void;
  /**
   * Event emitted when fullscreen mode has been entered.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenEnter?: (event: { nativeEvent: FullscreenEnterEvent }) => void;
  /**
   * Event emitted when fullscreen mode has been exited.
   *
   * @platform iOS, Android
   */
  onBmpFullscreenExit?: (event: { nativeEvent: FullscreenExitEvent }) => void;
  /**
   * Event mitted when the availability of the Picture in Picture mode changed.
   */
  onBmpPictureInPictureAvailabilityChanged?: (event: {
    nativeEvent: PictureInPictureAvailabilityChangedEvent;
  }) => void;
  /**
   * Event emitted when the player enters Picture in Picture mode.
   */
  onBmpPictureInPictureEnter?: (event: {
    nativeEvent: PictureInPictureEnterEvent;
  }) => void;
  /**
   * Event emitted when the player entered Picture in Picture mode.
   */
  onBmpPictureInPictureEntered?: (event: {
    nativeEvent: PictureInPictureEnteredEvent;
  }) => void;
  /**
   * Event emitted when the player exits Picture in Picture mode.
   */
  onBmpPictureInPictureExit?: (event: {
    nativeEvent: PictureInPictureExitEvent;
  }) => void;
  /**
   * Event emitted when the player exited Picture in Picture mode.
   */
  onBmpPictureInPictureExited?: (event: {
    nativeEvent: PictureInPictureExitedEvent;
  }) => void;
};
