import { requireNativeComponent, ViewStyle } from 'react-native';

export interface PlayerViewNativeComponentProps {
  color: string;
  style: ViewStyle;
}

export const PlayerViewNativeComponent =
  requireNativeComponent<PlayerViewNativeComponentProps>(
    'PlayerViewNativeComponent'
  );
