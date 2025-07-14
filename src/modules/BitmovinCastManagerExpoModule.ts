import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type BitmovinCastManagerExpoModuleEvents = Record<string, any>;

declare class BitmovinCastManagerExpoModule extends NativeModule<BitmovinCastManagerExpoModuleEvents> {
  isInitialized(): Promise<boolean>;
  initializeCastManager(options?: Record<string, any>): Promise<void>;
  sendMessage(message: string, messageNamespace?: string): Promise<void>;
  updateContext?(): Promise<void>; // Android only
}

export default requireNativeModule<BitmovinCastManagerExpoModule>(
  'BitmovinCastManagerModule'
);
