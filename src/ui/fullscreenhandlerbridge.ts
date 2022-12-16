import { NativeModules } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import { FullscreenHandler } from './fullscreenhandler';

const Uuid = NativeModules.UuidModule;
const FullscreenHandlerModule = NativeModules.FullscreenHandlerModule;

/**
 * Takes care of JS/Native communication for a FullscreenHandler.
 */
export class FullscreenHandlerBridge {
  readonly nativeId: string;
  fullscreenHandler?: FullscreenHandler;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Uuid.generate();
    BatchedBridge.registerCallableModule(
      `bmFullscreenBridge-${this.nativeId}`,
      this
    );
    FullscreenHandlerModule.registerHandler(this.nativeId);
  }

  /**
   * Called by native code, when the UI should enter fullscreen.
   */
  enterFullscreen(): void {
    this.fullscreenHandler?.enterFullscreen();
    FullscreenHandlerModule.onFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  /**
   * Called by native code, when the UI should exit fullscreen.
   */
  exitFullscreen(): void {
    this.fullscreenHandler?.exitFullscreen();
    FullscreenHandlerModule.onFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }
}
