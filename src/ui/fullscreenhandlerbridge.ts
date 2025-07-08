import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import { FullscreenHandler } from './fullscreenhandler';
import UuidExpoModule from '../modules/UuidExpoModule';
import FullscreenHandlerExpoModule from './fullscreenHandlerExpoModule';

/**
 * Takes care of JS/Native communication for a FullscreenHandler.
 */
export class FullscreenHandlerBridge {
  readonly nativeId: string;
  fullscreenHandler?: FullscreenHandler;
  isDestroyed: boolean;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? UuidExpoModule.generate();
    this.isDestroyed = false;
    BatchedBridge.registerCallableModule(
      `FullscreenBridge-${this.nativeId}`,
      this
    );
    FullscreenHandlerExpoModule.registerHandler(this.nativeId);
  }

  setFullscreenHandler(fullscreenHandler: FullscreenHandler | undefined) {
    if (this.fullscreenHandler === fullscreenHandler) {
      return;
    }

    this.fullscreenHandler = fullscreenHandler;

    // synchronize current state from fullscreenHandler to native
    FullscreenHandlerExpoModule.setIsFullscreenActive(
      this.nativeId,
      fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  /**
   * Destroys the native FullscreenHandler
   */
  destroy() {
    if (!this.isDestroyed) {
      FullscreenHandlerExpoModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI should enter fullscreen.
   */
  enterFullscreen(): void {
    this.fullscreenHandler?.enterFullscreen();
    FullscreenHandlerExpoModule.onFullscreenChanged(
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
    FullscreenHandlerExpoModule.onFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }
}
