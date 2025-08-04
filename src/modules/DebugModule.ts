import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type DebugModuleEvents = Record<string, any>;

declare class DebugModule extends NativeModule<DebugModuleEvents> {
  setDebugLoggingEnabled(enabled: boolean): Promise<void>;
}

export default requireNativeModule<DebugModule>('DebugModule');
