import { requireNativeComponent } from 'react-native';
import { NativePlayerViewEvents } from './events';
import { BasePlayerViewProps } from './index';

export interface NativePlayerViewProps
  extends BasePlayerViewProps,
    NativePlayerViewEvents {}

export const NativePlayerView =
  requireNativeComponent<NativePlayerViewProps>('NativePlayerView');
