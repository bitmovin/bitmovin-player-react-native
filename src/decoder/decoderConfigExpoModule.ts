import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type DecoderConfigExpoModuleEvents = Record<string, any>;

/**
 * Native DecoderConfigExpoModule using Expo modules API.
 * Android-only module for decoder configuration.
 */
declare class DecoderConfigExpoModule extends NativeModule<DecoderConfigExpoModuleEvents> {
  initializeWithConfig(
    nativeId: string,
    config: Record<string, any>
  ): Promise<void>;
  overrideDecoderPriorityProviderComplete(
    nativeId: string,
    response: any[]
  ): Promise<void>;
  destroy(nativeId: string): Promise<void>;
}

/**
 * Expo-based DecoderConfigModule implementation.
 * Android-only module that gracefully handles iOS by providing no-op implementations.
 */
let DecoderConfigExpoModuleInstance: any;

if (Platform.OS === 'android') {
  DecoderConfigExpoModuleInstance =
    requireNativeModule<DecoderConfigExpoModule>('DecoderConfigExpoModule');
} else {
  // iOS graceful fallback - provide no-op implementations
  DecoderConfigExpoModuleInstance = {
    initializeWithConfig: async () => {
      // No-op on iOS
    },
    overrideDecoderPriorityProviderComplete: async () => {
      // No-op on iOS
    },
    destroy: async () => {
      // No-op on iOS
    },
    addListener: () => ({ remove: () => {} }),
    removeListener: () => {},
    removeAllListeners: () => {},
    emit: () => {},
    listenerCount: () => 0,
  };
}

export default DecoderConfigExpoModuleInstance;
