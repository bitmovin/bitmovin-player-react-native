import type { NativeSyntheticEvent } from 'react-native';
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
 * View events arrive through React Native's nativeEvent wrapper. PlayerView
 * unwraps it before invoking public callbacks; SharedObject events arrive as
 * direct payloads through Player.on and Source.on.
 */
export interface NativePlayerViewEvents {
  onBmpPictureInPictureAvailabilityChanged?: (
    event: NativeSyntheticEvent<PictureInPictureAvailabilityChangedEvent>
  ) => void;
  onBmpFullscreenEnabled?: (
    event: NativeSyntheticEvent<FullscreenEnabledEvent>
  ) => void;
  onBmpFullscreenDisabled?: (
    event: NativeSyntheticEvent<FullscreenDisabledEvent>
  ) => void;
  onBmpFullscreenEnter?: (
    event: NativeSyntheticEvent<FullscreenEnterEvent>
  ) => void;
  onBmpFullscreenExit?: (
    event: NativeSyntheticEvent<FullscreenExitEvent>
  ) => void;
  onBmpPictureInPictureEnter?: (
    event: NativeSyntheticEvent<PictureInPictureEnterEvent>
  ) => void;
  onBmpPictureInPictureEntered?: (
    event: NativeSyntheticEvent<PictureInPictureEnteredEvent>
  ) => void;
  onBmpPictureInPictureExit?: (
    event: NativeSyntheticEvent<PictureInPictureExitEvent>
  ) => void;
  onBmpPictureInPictureExited?: (
    event: NativeSyntheticEvent<PictureInPictureExitedEvent>
  ) => void;
}
