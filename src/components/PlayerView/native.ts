import { requireNativeComponent } from 'react-native';
import { NativePlayerViewEvents } from './events';
import { BasePlayerViewProps } from './properties';
import { FullscreenHandlerBridge } from '../../ui/fullscreenhandlerbridge';
import { CustomMessageHandlerBridge } from '../../ui/custommessagehandlerbridge';

/**
 * Props type for `NativePlayerView` native component.
 * Mostly maps the event props defined in native code.
 */
export interface NativePlayerViewProps
  extends BasePlayerViewProps,
    NativePlayerViewEvents {
  fullscreenBridge?: FullscreenHandlerBridge;
  customMessageHandlerBridge?: CustomMessageHandlerBridge;
}

/**
 * Native host component bridging Bitmovin's `PlayerView`.
 */
export const NativePlayerView =
  requireNativeComponent<NativePlayerViewProps>('NativePlayerView');
