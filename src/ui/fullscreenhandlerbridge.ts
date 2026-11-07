import type { FullscreenHandler } from './fullscreenhandler';
import FullscreenHandlerModule, {
  type NativeFullscreen,
} from './fullscreenHandlerModule';
import { createNativeCallback } from '../nativeCallbacks';

/** Takes care of JS/Native communication for a FullscreenHandler. */
export class FullscreenHandlerBridge {
  /** @internal */
  native?: NativeFullscreen;
  fullscreenHandler?: FullscreenHandler;
  isDestroyed = false;

  constructor() {
    this.native = FullscreenHandlerModule.create(
      createNativeCallback((operation) => {
        if (operation === 'enterFullscreen')
          this.fullscreenHandler?.enterFullscreen();
        if (operation === 'exitFullscreen')
          this.fullscreenHandler?.exitFullscreen();
        return this.fullscreenHandler?.isFullscreenActive ?? false;
      })
    );
  }

  setFullscreenHandler(fullscreenHandler: FullscreenHandler | undefined) {
    if (this.fullscreenHandler === fullscreenHandler) return;
    this.fullscreenHandler = fullscreenHandler;
    void this.native?.setIsFullscreenActive(
      fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  destroy() {
    if (!this.isDestroyed) {
      const native = this.native;
      this.native = undefined;
      this.isDestroyed = true;
      void native?.destroy();
    }
  }
}
