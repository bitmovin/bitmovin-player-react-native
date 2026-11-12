import { requireNativeViewManager } from 'expo-modules-core';
import type { NativeSyntheticEvent, ViewStyle } from 'react-native';
import type { NativePlayerViewEvents } from './nativeEvents';
import type { ScalingMode } from '../../styleConfig';
import type { PlayerViewConfig } from './playerViewConfig';
import type { RefObject } from 'react';
import type { NativePlayer } from '../../modules/playerModule';
import type { NativeFullscreenHandler } from '../../ui/fullscreenHandlerModule';
import type { NativeCustomMessageHandler } from '../../ui/customMessageHandlerModule';
import type { PictureInPictureAction } from './pictureInPictureAction';

export interface NativePlayerViewConfig {
  playerViewConfig?: PlayerViewConfig;
  enableBackgroundPlayback?: boolean;
  isPictureInPictureEnabledOnPlayer?: boolean;
  userInterfaceTypeName?: string;
}

/**
 * Props type for `NativePlayerView` native component.
 * Mostly maps the event props defined in native code.
 */
export interface NativePlayerViewProps extends NativePlayerViewEvents {
  ref?: RefObject<NativePlayerViewRef | null>;
  onBmpViewAttached?: (
    event: NativeSyntheticEvent<Record<string, never>>
  ) => void;
  onBmpPlayerViewReady?: (
    event: NativeSyntheticEvent<Record<string, never>>
  ) => void;
  isFullscreenRequested?: boolean;
  scalingMode?: ScalingMode;
  isPictureInPictureRequested?: boolean;
  style?: ViewStyle;
}

export interface NativePlayerViewRef {
  attachBindings(
    player: NativePlayer,
    fullscreenHandler: NativeFullscreenHandler | undefined,
    customMessageHandler: NativeCustomMessageHandler | undefined,
    config: NativePlayerViewConfig
  ): Promise<void>;
  updatePictureInPictureActions(
    actions: PictureInPictureAction[]
  ): Promise<void>;
  setIsPictureInPictureEnabled(enabled: boolean): Promise<void>;
}

/**
 * Native host component bridging Bitmovin's `PlayerView`.
 */
export const NativePlayerView = requireNativeViewManager<NativePlayerViewProps>(
  'RNPlayerViewManager'
);
