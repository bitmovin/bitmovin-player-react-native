import { ViewStyle, NativeModules, requireNativeComponent } from 'react-native';

export const NativePlayerView = requireNativeComponent<{ style?: ViewStyle }>(
  'NativePlayerView'
);

export const NativePlayerModule = NativeModules.NativePlayerView;
