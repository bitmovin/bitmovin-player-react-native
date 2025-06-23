import { NativeModule, requireNativeModule } from 'expo';

import { BitmovinPlayerReactNativeModuleEvents } from './BitmovinPlayerReactNative.types';

declare class BitmovinPlayerReactNativeModule extends NativeModule<BitmovinPlayerReactNativeModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<BitmovinPlayerReactNativeModule>('BitmovinPlayerReactNative');
