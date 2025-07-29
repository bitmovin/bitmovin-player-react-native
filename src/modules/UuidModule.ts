import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type UuidModuleEvents = Record<string, any>;

declare class UuidModule extends NativeModule<UuidModuleEvents> {
  generate(): string;
}

export default requireNativeModule<UuidModule>('UuidModule');
