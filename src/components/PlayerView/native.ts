import { requireNativeViewManager } from 'expo-modules-core';
import type { ViewStyle } from 'react-native';
import { NativePlayerViewEvents } from './nativeEvents';
import { ScalingMode } from '../../styleConfig';
import { PlayerViewConfig } from './playerViewConfig';
import { ComponentRef, RefObject } from 'react';
import { PictureInPictureAction } from './pictureInPictureConfig';

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

export type PlayerViewRef = ComponentRef<typeof NativePlayerView> & {
  /**
   * Update PiP actions that should be displayed on the PiP window.
   * See {@link PictureInPictureConfig.pictureInPictureActions} for more details
   *
   * @example
   * Sample usage:
   * ```ts
   * const playerViewRef = useRef<NativePlayerViewRef>(null);
   * ...
   * useEffect(() => {
   *   playerViewRef.current?.updatePictureInPictureActions(pictureInPictureActions);
   * }, [pictureInPictureActions]);
   * ...
   * return (<PlayerView
   *         viewRef={playerViewRef} />)
   * ```
   */
  updatePictureInPictureActions: (
    actions: PictureInPictureAction[]
  ) => Promise<void>;
};
