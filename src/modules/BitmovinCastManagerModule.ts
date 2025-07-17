import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type BitmovinCastManagerModuleEvents = Record<string, any>;

declare class BitmovinCastManagerModule extends NativeModule<BitmovinCastManagerModuleEvents> {
  isInitialized(): Promise<boolean>;
  initializeCastManager(options?: Record<string, any>): Promise<void>;
  sendMessage(message: string, messageNamespace?: string): Promise<void>;
  updateContext?(): Promise<void>; // Android only
}

export default requireNativeModule<BitmovinCastManagerModule>(
  'BitmovinCastManagerModule'
);
