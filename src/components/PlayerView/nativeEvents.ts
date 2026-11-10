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

/** Events owned by the native view rather than its player. */
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
