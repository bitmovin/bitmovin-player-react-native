import { requireNativeModule } from 'expo-modules-core';

export interface UuidExpoModuleType {
  generate(): string;
}

export default requireNativeModule<UuidExpoModuleType>('UuidModule');
