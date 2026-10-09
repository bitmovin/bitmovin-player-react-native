import { requireNativeViewManager } from 'expo-modules-core';
import type { ViewStyle } from 'react-native';
import type { NativePlayerViewEvents } from './nativeEvents';
import type { ScalingMode } from '../../styleConfig';
import type { PlayerViewConfig } from './playerViewConfig';
import type { RefObject } from 'react';

export interface NativePlayerViewConfig {
  playerViewConfig?: PlayerViewConfig;
  playerId: string;
  customMessageHandlerBridgeId?: string;
  enableBackgroundPlayback?: boolean;
  isPictureInPictureEnabledOnPlayer?: boolean;
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
