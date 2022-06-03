import {
  ViewStyle,
  NativeModules,
  requireNativeComponent,
  NativeSyntheticEvent,
} from 'react-native';
import { Event, PlayEvent } from '../events';

type Props = {
  style?: ViewStyle;
  onPlay: (event: NativeSyntheticEvent<PlayEvent>) => void;
  onEvent: (event: NativeSyntheticEvent<Event>) => void;
  onReady: (event: NativeSyntheticEvent<Event>) => void;
};

export const NativePlayerView =
  requireNativeComponent<Props>('NativePlayerView');

export const NativePlayerModule = NativeModules.NativePlayerView;
