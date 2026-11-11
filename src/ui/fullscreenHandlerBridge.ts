import type { FullscreenHandler } from './fullscreenHandler';
import { NativeFullscreen } from './fullscreenHandlerModule';
import { NativeCallbacks } from '../native/nativeCallbacks';
/** Adapts a user-supplied fullscreen interface to the native handler object. @internal */
export class FullscreenHandlerBridge extends NativeFullscreen {
  private handler?: FullscreenHandler;
  destroy = super.destroy.bind(this);

  constructor() {
    const callbacks = new NativeCallbacks((operation) => {
      if (operation === 'enterFullscreen') this.handler?.enterFullscreen();
      if (operation === 'exitFullscreen') this.handler?.exitFullscreen();
      return this.handler?.isFullscreenActive ?? false;
    });
    super(callbacks.callback);
    callbacks.retain(this);
  }
  setFullscreenHandler(handler: FullscreenHandler | undefined): void {
    if (this.handler === handler) return;
    this.handler = handler;
    void super.setIsFullscreenActive(handler?.isFullscreenActive ?? false);
  }
}
