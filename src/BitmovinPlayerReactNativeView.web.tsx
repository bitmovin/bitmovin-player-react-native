import * as React from 'react';

import { BitmovinPlayerReactNativeViewProps } from './BitmovinPlayerReactNative.types';

export default function BitmovinPlayerReactNativeView(props: BitmovinPlayerReactNativeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
