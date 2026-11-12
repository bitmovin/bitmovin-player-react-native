import type { FullscreenHandler } from './fullscreenHandler';
import { SharedFullscreenHandler } from './fullscreenHandlerModule';
/** Adapts a user-supplied fullscreen interface to the native handler object. @internal */
export class FullscreenHandlerBridge {
  /** @internal Native peer used by the view and runtime API adapters. */
  readonly native: SharedFullscreenHandler;
  private handler?: FullscreenHandler;

  private readonly config = {
    enterFullscreen: () => {
      this.handler?.enterFullscreen();
      return this.handler?.isFullscreenActive ?? false;
    },
    exitFullscreen: () => {
      this.handler?.exitFullscreen();
      return this.handler?.isFullscreenActive ?? false;
    },
  };

  constructor() {
    this.native = new SharedFullscreenHandler(this.config);
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
