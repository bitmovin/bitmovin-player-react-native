import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type UuidExpoModuleEvents = Record<string, any>;

declare class UuidExpoModule extends NativeModule<UuidExpoModuleEvents> {
  generate(): string;
}

export default requireNativeModule<UuidExpoModule>('UuidModule');
