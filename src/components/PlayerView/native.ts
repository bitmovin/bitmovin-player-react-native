import { requireNativeViewManager } from 'expo-modules-core';
import { NativePlayerViewEvents } from './nativeEvents';
import { BasePlayerViewProps } from './properties';

export interface PlayerViewInitialConfig {
  playerId: string;
  customMessageHandlerBridgeId?: string;
  enableBackgroundPlayback?: boolean;
  isPictureInPictureEnabled?: boolean;
  userInterfaceTypeName?: string;
}

/**
 * Props type for `NativePlayerView` native component.
 * Mostly maps the event props defined in native code.
 */
export interface NativePlayerViewProps
  extends BasePlayerViewProps,
    NativePlayerViewEvents {
  playerInfo: PlayerViewInitialConfig;
  fullscreenBridgeId?: string;
}

/**
 * Native host component bridging Bitmovin's `PlayerView`.
 */
export const NativePlayerView = requireNativeViewManager<NativePlayerViewProps>(
  'RNPlayerViewManagerExpo'
);
