import { registerWebModule, NativeModule } from 'expo';

import { BitmovinPlayerReactNativeModuleEvents } from './BitmovinPlayerReactNative.types';

class BitmovinPlayerReactNativeModule extends NativeModule<BitmovinPlayerReactNativeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(BitmovinPlayerReactNativeModule);
