import { NativeInstanceConfig } from '../nativeInstance';

/**
 * Configures the playback behaviour of the player.
 *
 * @platform Android
 */
export interface DecoderConfig extends NativeInstanceConfig {
  decoderPriorityProvider?: DecoderPriorityProvider | null;
}

/**
 * Can be set on the `DecoderConfig.decoderPriorityProvider` to override the default decoder selection logic.
 *
 * @platform Android
 * */
export interface DecoderPriorityProvider {
  overrideDecodersPriority: (
    context: DecoderContext,
    preferredDecoders: MediaCodecInfo[]
  ) => MediaCodecInfo[];
}

/** The context in which a new decoder is chosen. */
export interface DecoderContext {
  mediaType: DecoderContextMediaType;
  isAd: boolean;
}

export interface MediaCodecInfo {
  name: String;
  isSoftware: boolean;
}

export enum DecoderContextMediaType {
  AUDIO = 'Audio',
  VIDEO = 'Video',
}
