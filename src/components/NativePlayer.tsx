import {
  ViewStyle,
  NativeModules,
  requireNativeComponent,
  NativeSyntheticEvent,
} from 'react-native';

import { Event, PlayEvent } from '../events';

/**
 * Props for the native player view.
 * @internal
 */
export interface NativePlayerViewProps {
  style?: ViewStyle;
  onPlay: (event: NativeSyntheticEvent<PlayEvent>) => void;
  onEvent: (event: NativeSyntheticEvent<Event>) => void;
  onReady: (event: NativeSyntheticEvent<Event>) => void;
}

/**
 * The native player view.
 * @internal
 */
export const NativePlayerView =
  requireNativeComponent<NativePlayerViewProps>('NativePlayerView');

/**
 * The native player module.
 * @internal
 */
export const NativePlayerModule = NativeModules.NativePlayerView;
