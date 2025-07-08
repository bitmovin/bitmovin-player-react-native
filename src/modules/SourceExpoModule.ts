import { requireNativeModule } from 'expo-modules-core';

export interface SourceExpoModuleType {
  /**
   * Returns the count of active sources for debugging purposes
   */
  getSourceCount(): number;

  /**
   * Checks if a source with the given nativeId exists
   */
  hasSource(nativeId: string): boolean;

  // TODO: Add method types as they are migrated from SourceModule
  // Priority: initWithConfig, setSourceConfig methods
}

export default requireNativeModule<SourceExpoModuleType>('SourceExpoModule');
