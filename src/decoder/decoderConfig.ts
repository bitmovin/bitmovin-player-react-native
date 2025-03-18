/**
 * Configures the playback behaviour of the player.
 *
 @platform Android
 */
export interface DecoderConfig {
  decoderPriorityProvider?: DecoderPriorityProvider | null;
}

/**
 * Configures the playback behaviour of the player.
 *
 @platform Android
 */
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
  AUDIO = 'audio',
  VIDEO = 'video',
}
