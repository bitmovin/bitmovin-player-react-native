import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type FullscreenHandlerModuleEvents = {
  onEnterFullscreen: ({
    nativeId,
    id,
  }: {
    nativeId: string;
    id: number;
  }) => void;
  onExitFullscreen: ({
    nativeId,
    id,
  }: {
    nativeId: string;
    id: number;
  }) => void;
};

declare class FullscreenHandlerModule extends NativeModule<FullscreenHandlerModuleEvents> {
  registerHandler(nativeId: string): Promise<void>;
  destroy(nativeId: string): Promise<void>;
  notifyFullscreenChanged(
    id: number,
    isFullscreenEnabled: boolean
  ): Promise<void>;
  setIsFullscreenActive(
    nativeId: string,
    isFullscreenActive: boolean
  ): Promise<void>;
}

export default requireNativeModule<FullscreenHandlerModule>(
  'FullscreenHandlerModule'
);
