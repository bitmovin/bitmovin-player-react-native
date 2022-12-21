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
  isDestroyed: boolean;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Uuid.generate();
    this.isDestroyed = false;
    BatchedBridge.registerCallableModule(
      `FullscreenBridge-${this.nativeId}`,
      this
    );
    FullscreenHandlerModule.registerHandler(this.nativeId);
  }

  /**
   * Destroys the native FullscreenHandler
   */
  destroy() {
    if (!this.isDestroyed) {
      FullscreenHandlerModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }

  // noinspection JSUnusedGlobalSymbols
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

  // noinspection JSUnusedGlobalSymbols
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
