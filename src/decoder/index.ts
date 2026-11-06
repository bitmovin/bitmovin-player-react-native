import type { DecoderConfig } from './decoderConfig';
import NativeInstance from '../nativeInstance';
import DecoderConfigModule, { getNativeDecoder } from './decoderConfigModule';
import { getOrCreate, remove } from '../nativeInstanceRegistry';
import {
  createNativeCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';

/** Takes care of JS/Native communication for a `DecoderConfig`. */
export class DecoderConfigBridge extends NativeInstance<DecoderConfig> {
  isInitialized = false;
  isDestroyed = false;

  initialize() {
    if (!this.isInitialized) {
      const module = DecoderConfigModule;
      if (module) {
        getOrCreate('decoder', this.nativeId, () =>
          module.create(
            serializeNativeConfig(this.config ?? {}),
            createNativeCallback((operation, [context, preferredDecoders]) => {
              if (operation !== 'overrideDecodersPriority') return null;
              return (
                this.config?.decoderPriorityProvider?.overrideDecodersPriority(
                  context,
                  preferredDecoders
                ) ?? preferredDecoders
              );
            })
          )
        );
      }
      this.isInitialized = true;
    }
  }

  destroy() {
    if (!this.isDestroyed) {
      const native = getNativeDecoder(this.nativeId);
      if (native) {
        void native.destroy();
        remove('decoder', this.nativeId, native);
      }
      this.isDestroyed = true;
    }
  }
}
