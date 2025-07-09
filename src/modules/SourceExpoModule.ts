import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type SourceExpoModuleEvents = Record<string, any>;

declare class SourceExpoModule extends NativeModule<SourceExpoModuleEvents> {
  /**
   * Returns the count of active sources for debugging purposes
   */
  getSourceCount(): number;

  /**
   * Checks if a source with the given nativeId exists
   */
  hasSource(nativeId: string): boolean;

  // TODO: Add method types as they are migrated from SourceModule
  // Priority: initializeWithConfig, setSourceConfig methods
}

export default requireNativeModule<SourceExpoModule>('SourceExpoModule');
