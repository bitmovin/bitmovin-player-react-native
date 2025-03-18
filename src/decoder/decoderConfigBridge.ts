import { NativeModules } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import {
  DecoderConfig,
  DecoderContext,
  DecoderContextMediaType,
  MediaCodecInfo,
} from './decoderConfig';

const Uuid = NativeModules.UuidModule;
const DecoderConfigModule = NativeModules.DecoderConfigModule;

/**
 * Takes care of JS/Native communication for a FullscreenHandler.
 */
export class DecoderConfigBridge {
  readonly nativeId: string;
  decoderConfig?: DecoderConfig;
  isDestroyed: boolean;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Uuid.generate();
    this.isDestroyed = false;
    BatchedBridge.registerCallableModule(
      `DecoderConfigBridge-${this.nativeId}`,
      this
    );
    DecoderConfigModule.registerHandler(this.nativeId);
  }

  /**
   * Destroys the native FullscreenHandler
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
    contextJson: String,
    preferredDecodersJson: String
  ): void {
    console.log(contextJson, preferredDecodersJson);

    // TODO: map the string to local elements
    const context: DecoderContext = {
      isAd: false,
      mediaType: DecoderContextMediaType.AUDIO,
    };
    const preferredDecoders: MediaCodecInfo[] = [];

    const orderedPriority =
      this.decoderConfig?.decoderPriorityProvider?.overrideDecodersPriority(
        context,
        preferredDecoders
      );
    DecoderConfigModule.overrideDecoderPriorityProviderComplete(
      this.nativeId,
      orderedPriority ?? []
    );
  }
}
