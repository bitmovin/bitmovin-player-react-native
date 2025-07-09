import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/**
 * Native DecoderConfigExpoModule interface using Expo modules API.
 * Android-only module for decoder configuration.
 */
interface DecoderConfigExpoModuleInterface {
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
let DecoderConfigExpoModule: DecoderConfigExpoModuleInterface;

if (Platform.OS === 'android') {
  DecoderConfigExpoModule =
    requireNativeModule<DecoderConfigExpoModuleInterface>(
      'DecoderConfigExpoModule'
    );
} else {
  // iOS graceful fallback - provide no-op implementations
  DecoderConfigExpoModule = {
    initializeWithConfig: async () => {
      // No-op on iOS
    },
    overrideDecoderPriorityProviderComplete: async () => {
      // No-op on iOS
    },
    destroy: async () => {
      // No-op on iOS
    },
  };
}

export default DecoderConfigExpoModule;
export { DecoderConfigExpoModuleInterface };
