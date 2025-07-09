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

  private onEnterFullScreenSubscription?: any;
  private onExitFullScreenSubscription?: any;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? UuidExpoModule.generate();
    this.isDestroyed = false;

    this.onEnterFullScreenSubscription =
      FullscreenHandlerExpoModule.addListener(
        'onEnterFullscreen',
        ({ nativeId }) => {
          if (nativeId !== this.nativeId) {
            return;
          }
          this.enterFullscreen();
        }
      );
    this.onExitFullScreenSubscription = FullscreenHandlerExpoModule.addListener(
      'onExitFullscreen',
      ({ nativeId }) => {
        if (nativeId !== this.nativeId) {
          return;
        }
        this.exitFullscreen();
      }
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
      this.onEnterFullScreenSubscription?.remove();
      this.onExitFullScreenSubscription?.remove();
      this.onEnterFullScreenSubscription = undefined;
      this.onExitFullScreenSubscription = undefined;
      this.isDestroyed = true;
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI should enter fullscreen.
   */
  private enterFullscreen(): void {
    this.fullscreenHandler?.enterFullscreen();
    FullscreenHandlerExpoModule.notifyFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI should exit fullscreen.
   */
  private exitFullscreen(): void {
    this.fullscreenHandler?.exitFullscreen();
    FullscreenHandlerExpoModule.notifyFullscreenChanged(
      this.nativeId,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }
}
