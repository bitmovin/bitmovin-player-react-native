import type { FullscreenHandler } from './fullscreenHandler';
import FullscreenHandlerModule, {
  type NativeFullscreen,
} from './fullscreenHandlerModule';
import { NativeCallbacks } from '../native/nativeCallbacks';

/** Takes care of JS/Native communication for a FullscreenHandler. */
export class FullscreenHandlerBridge {
  /** @internal */
  readonly native: NativeFullscreen;
  fullscreenHandler?: FullscreenHandler;

  constructor() {
    this.native = new NativeCallbacks((operation) => {
      if (operation === 'enterFullscreen')
        this.fullscreenHandler?.enterFullscreen();
      if (operation === 'exitFullscreen')
        this.fullscreenHandler?.exitFullscreen();
      return this.fullscreenHandler?.isFullscreenActive ?? false;
    }).create((callback) => FullscreenHandlerModule.create(callback));
  }

  setFullscreenHandler(fullscreenHandler: FullscreenHandler | undefined) {
    if (this.fullscreenHandler === fullscreenHandler) return;
    this.fullscreenHandler = fullscreenHandler;
    void this.native.setIsFullscreenActive(
      fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  destroy() {
    void this.native.destroy();
  }
}
