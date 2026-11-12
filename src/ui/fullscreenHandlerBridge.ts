import type { FullscreenHandler } from './fullscreenHandler';
import { SharedFullscreenHandler } from './fullscreenHandlerModule';
import { NativeCallbacks } from '../native/nativeCallbacks';
/** Adapts a user-supplied fullscreen interface to the native handler object. @internal */
export class FullscreenHandlerBridge {
  /** @internal Native peer used by the view and runtime API adapters. */
  readonly native: SharedFullscreenHandler;
  private handler?: FullscreenHandler;

  // Native forwarding holds the dispatcher weakly; this field owns configured callbacks.
  declare private readonly callbacks?: NativeCallbacks;

  constructor() {
    const callbacks = new NativeCallbacks((operation) => {
      if (operation === 'enterFullscreen') this.handler?.enterFullscreen();
      if (operation === 'exitFullscreen') this.handler?.exitFullscreen();
      return this.handler?.isFullscreenActive ?? false;
    });
    this.native = new SharedFullscreenHandler(callbacks.callback);
    this.callbacks = callbacks;
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
