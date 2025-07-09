import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type AudioSessionExpoModuleEvents = Record<string, any>;

declare class AudioSessionExpoModule extends NativeModule<AudioSessionExpoModuleEvents> {
  setCategory(category: string): Promise<void>;
}

// iOS-only module
export default Platform.OS === 'ios'
  ? requireNativeModule<AudioSessionExpoModule>('AudioSessionModule')
  : null;
