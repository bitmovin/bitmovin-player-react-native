import { EventSubscription } from 'expo-modules-core';
import { FullscreenHandler } from './fullscreenhandler';
import * as Crypto from 'expo-crypto';
import FullscreenHandlerModule from './fullscreenHandlerModule';

/**
 * Takes care of JS/Native communication for a FullscreenHandler.
 */
export class FullscreenHandlerBridge {
  readonly nativeId: string;
  fullscreenHandler?: FullscreenHandler;
  isDestroyed: boolean;

  private onEnterFullScreenSubscription?: EventSubscription;
  private onExitFullScreenSubscription?: EventSubscription;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Crypto.randomUUID();
    this.isDestroyed = false;

    this.onEnterFullScreenSubscription = FullscreenHandlerModule.addListener(
      'onEnterFullscreen',
      ({ nativeId, id }) => {
        if (nativeId !== this.nativeId) {
          return;
        }
        this.enterFullscreen(id);
      }
    );
    this.onExitFullScreenSubscription = FullscreenHandlerModule.addListener(
      'onExitFullscreen',
      ({ nativeId, id }) => {
        if (nativeId !== this.nativeId) {
          return;
        }
        this.exitFullscreen(id);
      }
    );
    void FullscreenHandlerModule.registerHandler(this.nativeId);
  }

  setFullscreenHandler(fullscreenHandler: FullscreenHandler | undefined) {
    if (this.fullscreenHandler === fullscreenHandler) {
      return;
    }

    this.fullscreenHandler = fullscreenHandler;

    // synchronize current state from fullscreenHandler to native
    void FullscreenHandlerModule.setIsFullscreenActive(
      this.nativeId,
      fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  /**
   * Destroys the native FullscreenHandler
   */
  destroy() {
    if (!this.isDestroyed) {
      void FullscreenHandlerModule.destroy(this.nativeId);
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
  private enterFullscreen(id: number): void {
    this.fullscreenHandler?.enterFullscreen();
    void FullscreenHandlerModule.notifyFullscreenChanged(
      id,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI should exit fullscreen.
   */
  private exitFullscreen(id: number): void {
    this.fullscreenHandler?.exitFullscreen();
    void FullscreenHandlerModule.notifyFullscreenChanged(
      id,
      this.fullscreenHandler?.isFullscreenActive ?? false
    );
  }
}
