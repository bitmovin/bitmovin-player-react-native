import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface AudioSessionExpoModuleType {
  setCategory(category: string): Promise<void>;
}

// iOS-only module
export default Platform.OS === 'ios'
  ? requireNativeModule<AudioSessionExpoModuleType>('AudioSessionModule')
  : null;
