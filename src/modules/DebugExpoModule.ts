import { requireNativeModule } from 'expo-modules-core';

export interface DebugExpoModuleType {
  setDebugLoggingEnabled(enabled: boolean): Promise<void>;
}

export default requireNativeModule<DebugExpoModuleType>('DebugModule');
