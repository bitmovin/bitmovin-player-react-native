import type { FullscreenHandler } from './fullscreenHandler';
import { NativeFullscreen } from './fullscreenHandlerModule';
import { NativeCallbacks } from '../native/nativeCallbacks';
const states = new WeakMap<
  FullscreenHandlerBridge,
  { handler?: FullscreenHandler }
>();
/** Adapts a user-supplied fullscreen interface to the native handler object. @internal */
export class FullscreenHandlerBridge extends NativeFullscreen {
  constructor() {
    const state: { handler?: FullscreenHandler } = {};
    const callbacks = new NativeCallbacks((operation) => {
      if (operation === 'enterFullscreen') state.handler?.enterFullscreen();
      if (operation === 'exitFullscreen') state.handler?.exitFullscreen();
      return state.handler?.isFullscreenActive ?? false;
    });
    super(callbacks.callback);
    callbacks.retain(this);
    states.set(this, state);
  }
  setFullscreenHandler(handler: FullscreenHandler | undefined): void {
    const state = states.get(this)!;
    if (state.handler === handler) return;
    state.handler = handler;
    void super.setIsFullscreenActive(handler?.isFullscreenActive ?? false);
  }
}
