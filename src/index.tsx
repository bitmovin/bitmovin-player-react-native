import {
  requireNativeComponent,
  UIManager,
  Platform,
  ViewStyle,
} from 'react-native';

const LINKING_ERROR =
  `The package 'player-react-native-bridge' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

type PlayerReactNativeBridgeProps = {
  color: string;
  style: ViewStyle;
};

const ComponentName = 'PlayerReactNativeBridgeView';

export const PlayerReactNativeBridgeView =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? requireNativeComponent<PlayerReactNativeBridgeProps>(ComponentName)
    : () => {
        throw new Error(LINKING_ERROR);
      };
