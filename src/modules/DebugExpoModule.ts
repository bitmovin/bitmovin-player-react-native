import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type DebugExpoModuleEvents = Record<string, any>;

declare class DebugExpoModule extends NativeModule<DebugExpoModuleEvents> {
  setDebugLoggingEnabled(enabled: boolean): Promise<void>;
}

export default requireNativeModule<DebugExpoModule>('DebugModule');
