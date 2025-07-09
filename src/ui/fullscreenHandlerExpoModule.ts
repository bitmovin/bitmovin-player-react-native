import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type FullscreenHandlerExpoModuleEvents = {
  onEnterFullscreen: ({ nativeId }: { nativeId: string }) => void;
  onExitFullscreen: ({ nativeId }: { nativeId: string }) => void;
};

declare class FullscreenHandlerExpoModule extends NativeModule<FullscreenHandlerExpoModuleEvents> {
  registerHandler(nativeId: string): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  notifyFullscreenChanged(
    nativeId: string,
    isFullscreenEnabled: boolean
  ): Promise<void>;
  setIsFullscreenActive(
    nativeId: string,
    isFullscreenActive: boolean
  ): Promise<void>;
}

export default requireNativeModule<FullscreenHandlerExpoModule>(
  'FullscreenHandlerExpoModule'
);
