import { NativeModules } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import { DecoderConfig, DecoderContext, MediaCodecInfo } from './decoderConfig';
import NativeInstance from '../nativeInstance';

const DecoderConfigModule = NativeModules.DecoderConfigModule;

/**
 * Takes care of JS/Native communication for a `DecoderConfig`.
 */
export class DecoderConfigBridge extends NativeInstance<DecoderConfig> {
  constructor(decoderConfig: DecoderConfig) {
    super(decoderConfig);
  }

  /**
   * Whether this object's native instance has been created.
   */
  isInitialized = false;
  /**
   * Whether this object's native instance has been disposed.
   */
  isDestroyed = false;

  initialize() {
    if (!this.isInitialized) {
      BatchedBridge.registerCallableModule(
        `DecoderConfigBridge-${this.nativeId}`,
        this
      );
      // Create native configuration object.
      DecoderConfigModule.initWithConfig(this.nativeId, this.config);
      this.isInitialized = true;
    }
  }

  /**
   * Destroys the native `DecoderConfig`
   */
  destroy() {
    if (!this.isDestroyed) {
      DecoderConfigModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the decoder priority should be evaluated.
   */
  overrideDecodersPriority(
    context: DecoderContext,
    preferredDecoders: [MediaCodecInfo]
  ): void {
    const orderedPriority =
      this.config?.decoderPriorityProvider?.overrideDecodersPriority(
        context,
        preferredDecoders
      ) ?? [];

    DecoderConfigModule.overrideDecoderPriorityProviderComplete(
      this.nativeId,
      orderedPriority
    );
  }
}
