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
  /**
   * Sets whether font sizes embedded within the cues should be applied.
   * Enabled by default.
   * Only takes effect if setApplyEmbeddedStyles is set to true.
   */
  applyEmbeddedFontSizes?: boolean;
  /**
   * Sets the caption style to be equivalent to the one returned by getUserStyle, or to a default style before API level 19.
   */
  userDefaultStyle?: boolean;
  /**
   * Sets the text size to one derived from getFontScale, or to a default size before API level 19.
   */
  userDefaultTextSize?: boolean;
  /**
   * Sets whether styling embedded within the cues should be applied.
   * Enabled by default.
   * Overrides any setting made with setApplyEmbeddedFontSizes.
   */
  applyEmbeddedStyles?: boolean;
  /**
   * Sets the bottom padding fraction to apply when getLine is DIMEN_UNSET, as a fraction of the view's remaining height after its top and bottom padding have been subtracted.
   */
  bottomPaddingFraction?: number;
  /**
   * Set the text size to a given unit and value.
   * `unit` defaults to `COMPLEX_UNIT_SP`
   */
  fixedTextSize?: {
    size: number;
    unit?:
      | 'COMPLEX_UNIT_PX'
      | 'COMPLEX_UNIT_DIP'
      | 'COMPLEX_UNIT_SP'
      | 'COMPLEX_UNIT_PT'
      | 'COMPLEX_UNIT_IN'
      | 'COMPLEX_UNIT_MM';
  };
  /**
   * Sets the text size to be a fraction of the height of this view.
   * When `ignorePadding` is true, sets the text size to be a fraction of the views remaining height after its top and bottom padding have been subtracted.
   */
  fractionalTextSize?: {
    fractionOfHeight: number;
    ignorePadding?: boolean;
  };
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
  player?: Player;
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
    <NativeSubtitleView
      style={style}
      playerId={props?.player?.nativeId}
      applyEmbeddedFontSizes={props.applyEmbeddedFontSizes}
      applyEmbeddedStyles={props.applyEmbeddedStyles}
      bottomPaddingFraction={props.bottomPaddingFraction}
      fixedTextSize={props.fixedTextSize}
      fractionalTextSize={props.fractionalTextSize}
    />
  ) : null;
}
