import type { FullscreenHandler } from './fullscreenHandler';
import { NativeFullscreen } from './fullscreenHandlerModule';
import { NativeCallbacks } from '../native/nativeCallbacks';
/** Adapts a user-supplied fullscreen interface to the native handler object. @internal */
export class FullscreenHandlerBridge {
  private readonly native: InternalFullscreen;
  private handler?: FullscreenHandler;

  constructor() {
    const callbacks = new NativeCallbacks((operation) => {
      if (operation === 'enterFullscreen') this.handler?.enterFullscreen();
      if (operation === 'exitFullscreen') this.handler?.exitFullscreen();
      return this.handler?.isFullscreenActive ?? false;
    });
    this.native = new InternalFullscreen(this, callbacks.callback);
    callbacks.retain(this);
  }
  destroy = (): Promise<void> => this.native.destroy();

  setFullscreenHandler(handler: FullscreenHandler | undefined): void {
    if (this.handler === handler) return;
    this.handler = handler;
    void this.native.setIsFullscreenActive(
      handler?.isFullscreenActive ?? false
    );
  }
}

/** @internal */
class InternalFullscreen extends NativeFullscreen {
  constructor(
    readonly fullscreen: FullscreenHandlerBridge,
    ...args: ConstructorParameters<typeof NativeFullscreen>
  ) {
    super(...args);
  }
}

/** @internal */
export function getNativeFullscreen(
  fullscreen: FullscreenHandlerBridge
): NativeFullscreen {
  return fullscreen['native'];
}
