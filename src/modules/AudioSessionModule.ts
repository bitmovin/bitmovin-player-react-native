import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type AudioSessionModuleEvents = Record<string, any>;

declare class AudioSessionModule extends NativeModule<AudioSessionModuleEvents> {
  setCategory(category: string): Promise<void>;
}

// iOS-only module
export default Platform.OS === 'ios'
  ? requireNativeModule<AudioSessionModule>('AudioSessionModule')
  : null;
