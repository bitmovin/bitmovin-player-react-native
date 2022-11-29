import { requireNativeComponent } from 'react-native';
import { BaseSubtitleViewProps } from './index';

/**
 * Props type for `NativeSubtitleView` native component.
 */
export interface SubtitleProps extends BaseSubtitleViewProps {
  playerId?: string;
}

/**
 * Native host component bridging Bitmovin's Android `SubtitleView`.
 */
export const NativeSubtitleView = requireNativeComponent<SubtitleProps>(
  'BitmovinSubtitleView'
);
