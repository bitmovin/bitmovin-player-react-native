import { NativeInstanceConfig } from '../nativeInstance';

/**
 * Configures the playback behaviour of the player.
 *
 * @platform Android
 */
export interface DecoderConfig extends NativeInstanceConfig {
  /**
   * A callback interface for sorting and filtering decoders based on priority.
   *
   * This callback is invoked when the player selects a decoder, providing the {@link DecoderContext}
   * and a list of available {@link MediaCodecInfo} objects. The list is initially ordered by
   * the default priority in which decoders will be attempted.
   *
   * The callback should return a reordered or filtered list of {@link MediaCodecInfo} objects
   * that determines the selection priority.
   *
   * ## Example Usage
   *
   * ### Prefer a specific decoder for main content video playback
   * The following example prioritizes a specific decoder for non-ad video playback:
   * ```ts
   * const decoderPriorityProvider: DecoderPriorityProvider = {
   *   overrideDecodersPriority: (context: DecoderContext, preferredDecoders: MediaCodecInfo[]): MediaCodecInfo[] => {
   *     if (!context.isAd && context.mediaType === DecoderContextMediaType.VIDEO) {
   *       // Prioritize a specific decoder
   *       return preferredDecoders.sort((a, b) => {
   *         const aAsNumber = a.name.startsWith("OMX.google.") ? 1 : 2
   *         const bAsNumber = b.name.startsWith("OMX.google.") ? 1 : 2
   *         return aAsNumber - bAsNumber
   *       })
   *     }
   *     return preferredDecoders
   *   }
   * }
   * ```
   *
   * ### Prefer software decoders for ads playback
   * The following example prioritizes software decoders over hardware decoders for ad playback:
   * ```ts
   * const decoderPriorityProvider: DecoderPriorityProvider = {
   *   overrideDecodersPriority: (context: DecoderContext, preferredDecoders: MediaCodecInfo[]): MediaCodecInfo[] => {
   *     if (context.isAd) {
   *       // Prioritize a specific decoder
   *       return preferredDecoders.sort((a, b) => {
   *         const aAsNumber = a.isSoftware ? 1 : 2
   *         const bAsNumber = b.isSoftware ? 1 : 2
   *         return aAsNumber - bAsNumber
   *       })
   *     }
   *     return preferredDecoders
   *   }
   * }
   * ```
   *
   * ### Disable software fallback for video playback
   * The following example disables software decoders for non-ad video playback:
   * ```ts
   * const decoderPriorityProvider: DecoderPriorityProvider = {
   *   overrideDecodersPriority: (context: DecoderContext, preferredDecoders: MediaCodecInfo[]): MediaCodecInfo[] => {
   *     if (!context.isAd && context.mediaType === DecoderContextMediaType.VIDEO) {
   *       // Prioritize a specific decoder
   *       return preferredDecoders.filter((info) => {
   *         return !info.isSoftware
   *       })
   *     }
   *     return preferredDecoders
   *   }
   * }
   * ```
   */
  decoderPriorityProvider?: DecoderPriorityProvider | null;
}

/**
 * Can be set on the `DecoderConfig.decoderPriorityProvider` to override the default decoder selection logic.
 * See {@link DecoderConfig#decoderPriorityProvider} for more details
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
  name: string;
  isSoftware: boolean;
}

export enum DecoderContextMediaType {
  AUDIO = 'Audio',
  VIDEO = 'Video',
}
