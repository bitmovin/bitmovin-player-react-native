import { NativeModule, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type DecoderConfigModuleEvents = {
  onOverrideDecodersPriority: ({
    nativeId,
    context,
    preferredDecoders,
  }: {
    nativeId: string;
    context: any;
    preferredDecoders: any[];
  }) => void;
};

/**
 * Native DecoderConfigModule using Expo modules API.
 * Android-only module for decoder configuration.
 */
declare class DecoderConfigModule extends NativeModule<DecoderConfigModuleEvents> {
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
let DecoderConfigModuleInstance: any;

if (Platform.OS === 'android') {
  DecoderConfigModuleInstance = requireNativeModule<DecoderConfigModule>(
    'DecoderConfigModule'
  );
} else {
  // iOS graceful fallback - provide no-op implementations
  DecoderConfigModuleInstance = {
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

export default DecoderConfigModuleInstance;
