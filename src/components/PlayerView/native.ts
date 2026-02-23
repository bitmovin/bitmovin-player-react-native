import { requireNativeViewManager } from 'expo-modules-core';
import type { ViewStyle } from 'react-native';
import { NativePlayerViewEvents } from './nativeEvents';
import { ScalingMode } from '../../styleConfig';
import { PlayerViewConfig } from './playerViewConfig';
import { RefObject } from 'react';

export interface NativePlayerViewConfig {
  playerViewConfig?: PlayerViewConfig;
  playerId: string;
  customMessageHandlerBridgeId?: string;
  enableBackgroundPlayback?: boolean;
  userInterfaceTypeName?: string;
}

/**
 * Props type for `NativePlayerView` native component.
 * Mostly maps the event props defined in native code.
 */
export interface NativePlayerViewProps extends NativePlayerViewEvents {
  ref?: RefObject<any>;
  isFullscreenRequested?: boolean;
  scalingMode?: ScalingMode;
  isPictureInPictureRequested?: boolean;
  style?: ViewStyle;
  config: NativePlayerViewConfig;
  fullscreenBridgeId?: string;
}

/**
 * Native host component bridging Bitmovin's `PlayerView`.
 */
export const NativePlayerView = requireNativeViewManager<NativePlayerViewProps>(
  'RNPlayerViewManager'
);
