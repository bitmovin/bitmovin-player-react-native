import { requireNativeView } from 'expo';
import * as React from 'react';

import { BitmovinPlayerReactNativeViewProps } from './BitmovinPlayerReactNative.types';

const NativeView: React.ComponentType<BitmovinPlayerReactNativeViewProps> =
  requireNativeView('BitmovinPlayerReactNative');

export default function BitmovinPlayerReactNativeView(props: BitmovinPlayerReactNativeViewProps) {
  return <NativeView {...props} />;
}
