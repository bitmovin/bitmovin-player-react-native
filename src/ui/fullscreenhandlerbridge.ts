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
    const native = this.native;
    this.native = undefined;
    void native?.destroy();
  }
}
