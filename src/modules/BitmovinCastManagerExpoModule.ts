import { requireNativeModule } from 'expo-modules-core';

export interface BitmovinCastManagerExpoModuleType {
  isInitialized(): Promise<boolean>;
  initializeCastManager(config?: Record<string, any>): Promise<void>;
  sendMessage(message: string, messageNamespace?: string): Promise<void>;
  updateContext?(): Promise<void>; // Android only
}

export default requireNativeModule<BitmovinCastManagerExpoModuleType>(
  'BitmovinCastManagerModule'
);
