import React from 'react';
import { ViewStyle, StyleSheet, StyleProp, Platform } from 'react-native';
import { NativeSubtitleView } from './native';
import { Player } from '../../player';

/**
 * Base `SubtitleView` component props. Used to establish common
 * props between `NativeSubtitleView` and `SubtitleView`.
 * @see NativePlayerView
 */
export interface BaseSubtitleViewProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * `SubtitleView` component props.
 * @see SubtitleView
 */
export interface SubtitleViewProps extends BaseSubtitleViewProps {
  /**
   * `Player` instance (generally returned from `usePlayer` hook) that will control
   * and render audio/video inside the `PlayerView`.
   */
  player: Player;
}

/**
 * Base style that initializes the native view frame when no width/height prop has been set.
 */
const styles = StyleSheet.create({
  baseStyle: {
    alignSelf: 'stretch',
  },
});

/**
 * Component that provides the Bitmovin Android SubtitleView for a `Player` instance.
 * This component needs a `Player` instance to work properly so make sure one is passed to it as a prop.
 */
export function SubtitleView(props: SubtitleViewProps) {
  // Style resulting from merging `baseStyle` and `props.style`.
  const style = StyleSheet.flatten([styles.baseStyle, props.style]);

  return Platform.OS === 'android' ? (
    <NativeSubtitleView style={style} playerId={props?.player?.nativeId} />
  ) : null;
}
