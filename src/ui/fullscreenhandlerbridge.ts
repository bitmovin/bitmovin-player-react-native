import type { FullscreenHandler } from './fullscreenhandler';
import * as Crypto from 'expo-crypto';
import FullscreenHandlerModule, {
  getNativeFullscreen,
} from './fullscreenHandlerModule';
import { getOrCreate, remove } from '../nativeInstanceRegistry';
import { createNativeCallback } from '../nativeCallbacks';

/** Takes care of JS/Native communication for a FullscreenHandler. */
export class FullscreenHandlerBridge {
  readonly nativeId: string;
  fullscreenHandler?: FullscreenHandler;
  isDestroyed = false;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Crypto.randomUUID();
    getOrCreate('fullscreen', this.nativeId, () =>
      FullscreenHandlerModule.create(
        createNativeCallback((operation) => {
          if (operation === 'enterFullscreen')
            this.fullscreenHandler?.enterFullscreen();
          if (operation === 'exitFullscreen')
            this.fullscreenHandler?.exitFullscreen();
          return this.fullscreenHandler?.isFullscreenActive ?? false;
        })
      )
    );
  }

  setFullscreenHandler(fullscreenHandler: FullscreenHandler | undefined) {
    if (this.fullscreenHandler === fullscreenHandler) return;
    this.fullscreenHandler = fullscreenHandler;
    void getNativeFullscreen(this.nativeId)?.setIsFullscreenActive(
      fullscreenHandler?.isFullscreenActive ?? false
    );
  }

  destroy() {
    if (!this.isDestroyed) {
      const native = getNativeFullscreen(this.nativeId);
      if (native) {
        void native.destroy();
        remove('fullscreen', this.nativeId, native);
      }
      this.isDestroyed = true;
    }
  }
}
