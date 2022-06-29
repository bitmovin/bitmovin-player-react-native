import { requireNativeComponent } from 'react-native';
import { NativePlayerViewEvents } from './events';
import { BasePlayerViewProps } from './index';

/**
 * Props type for `NativePlayerView` native component.
 * Mostly maps the event props defined in native code.
 */
export interface NativePlayerViewProps
  extends BasePlayerViewProps,
    NativePlayerViewEvents {}

/**
 * Native host component bridging Bitmovin's `PlayerView`.
 */
export const NativePlayerView =
  requireNativeComponent<NativePlayerViewProps>('NativePlayerView');
