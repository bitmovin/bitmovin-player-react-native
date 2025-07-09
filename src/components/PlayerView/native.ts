import { requireNativeViewManager } from 'expo-modules-core';
import { NativePlayerViewEvents } from './nativeEvents';
import { BasePlayerViewProps } from './properties';
import { PlayerConfig } from '../../playerConfig';

/**
 * Props type for `NativePlayerView` native component.
 * Mostly maps the event props defined in native code.
 */
export interface NativePlayerViewProps
  extends BasePlayerViewProps,
    NativePlayerViewEvents {
  playerConfig: { id: string } & PlayerConfig;
  fullscreenBridgeId?: string;
  customMessageHandlerBridgeId?: string;
}

/**
 * Native host component bridging Bitmovin's `PlayerView`.
 */
export const NativePlayerView = requireNativeViewManager<NativePlayerViewProps>(
  'RNPlayerViewManagerExpo'
);
