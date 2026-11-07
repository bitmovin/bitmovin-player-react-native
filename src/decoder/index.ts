import { setNativeOwner } from '../nativeOwner';
import type { DecoderConfig } from './decoderConfig';
import DecoderConfigModule, { getNativeDecoder } from './decoderConfigModule';
import {
  createNativeCallback,
  serializeNativeConfig,
} from '../nativeCallbacks';

/** Takes care of JS/Native communication for a `DecoderConfig`. */
export class DecoderConfigBridge {
  readonly config?: DecoderConfig;

  constructor(config?: DecoderConfig) {
    this.config = config;
  }

  isInitialized = false;
  isDestroyed = false;

  initialize() {
    if (!this.isInitialized) {
      const module = DecoderConfigModule;
      if (module) {
        const config = this.config;
        setNativeOwner(
          this,
          module.create(
            serializeNativeConfig(config ?? {}),
            createNativeCallback((operation, [context, preferredDecoders]) => {
              if (operation !== 'overrideDecodersPriority') return null;
              return (
                config?.decoderPriorityProvider?.overrideDecodersPriority(
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
      const native = getNativeDecoder(this);
      if (native) {
        void native.destroy();
        setNativeOwner(this);
      }
      this.isDestroyed = true;
    }
  }
}
