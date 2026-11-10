import type { FullscreenHandler } from './fullscreenhandler';
import FullscreenHandlerModule, {
  type NativeFullscreen,
} from './fullscreenHandlerModule';
import { NativeCallbacks } from '../nativeCallbacks';

/** Takes care of JS/Native communication for a FullscreenHandler. */
export class FullscreenHandlerBridge {
  /** @internal */
  readonly native: NativeFullscreen;
  fullscreenHandler?: FullscreenHandler;
  private readonly callbacks = new NativeCallbacks((operation) => {
    if (operation === 'enterFullscreen')
      this.fullscreenHandler?.enterFullscreen();
    if (operation === 'exitFullscreen')
      this.fullscreenHandler?.exitFullscreen();
    return this.fullscreenHandler?.isFullscreenActive ?? false;
  });

  constructor() {
    this.native = FullscreenHandlerModule.create(this.callbacks.weak());
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
