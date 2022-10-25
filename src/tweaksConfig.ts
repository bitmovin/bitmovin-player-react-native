/**
 * This configuration is used as an incubator for experimental features. Tweaks are not officially
 * supported and are not guaranteed to be stable, i.e. their naming, functionality and API can
 * change at any time within the tweaks or when being promoted to an official feature and moved
 * into its final configuration namespace.
 */
export interface TweaksConfig {
  /**
   * The frequency in seconds onTimeChanged is called with TimeChangedEvents.
   *
   * Default value in iOS is `1.0`.
   * Default value in Android is `0.2`.
   *
   * @platform iOS, Android
   */
  timeChangedInterval?: number;
  /**
   * If enabled, HLS playlists will be parsed and additional features and events are enabled. This includes:
   *
   * - MetadataEvents carrying segment-specific metadata for custom HLS tags, like #EXT-X-SCTE35
   * - MetadataParsedEvents carrying segment-specific metadata for custom HLS tags, like #EXT-X-SCTE35
   * - DrmDataParsedEvents when a #EXT-X-KEY is found
   * - Player.availableVideoQualities includes additional information
   * - Automatic retries when HLS playlist requests failed with non-2xx HTTP status code
   *
   * Default is false.
   *
   * @platform iOS
   */
  isNativeHlsParsingEnabled?: boolean;
  /**
   * If enabled, playlists will be downloaded by the Bitmovin Player SDK instead of AVFoundation.
   * This enables additional features and events, like:
   *
   * - DownloadFinishedEvents for playlist downloads.
   * - SourceWarningEvents when no #EXT-X-PLAYLIST-TYPE is found If set to false, enabling
   * nativeHlsParsingEnabled won’t have any effect.
   *
   * Default is true.
   *
   * @platform iOS
   */
  isCustomHlsLoadingEnabled?: boolean;
  /**
   * The threshold which will be applied when seeking to the end in seconds. This value will be used
   * to calculate the maximum seekable time when calling player.seek(time:) orplayer.playlist.seek(source:time:),
   * so the maximum value will be duration - seekToEndThreshold.
   *
   * This is useful if the duration of the segments does not match the duration specified in the
   * manifest. In this case, if we try to seek to the end, AVPlayer could get stuck and might stall
   * forever Therefore increasing this value could help.
   *
   * Default is 0.5.
   *
   * @platform iOS
   */
  seekToEndThreshold?: number;
  /**
   * Specifies the player behaviour when Player.play is called. Default is 'relaxed'.
   *
   * - 'relaxed': Starts playback when enough media data is buffered and continuous playback without stalling can be ensured. If insufficient media data is buffered for playback to start, the player will act as if the buffer became empty during playback.
   * - 'aggressive': When the buffer is not empty, this setting will cause the player to start playback of available media immediately. If insufficient media data is buffered for playback to start, the player will act as if the buffer became empty during playback.
   *
   * @platform iOS
   */
  playbackStartBehaviour?: 'relaxed' | 'aggressive';
  /**
   * Specifies the player behaviour when stalling should be exited. Default is 'relaxed'.
   *
   * - 'relaxed': The player will wait until the buffer is filled that it can, most likely, ensure continuous playback without another stalling right after playback continued.
   * - 'aggressive': The player will try to unstall as soon as some media data became available and will start playback of this media immediately.
   *
   * @platform iOS
   */
  unstallingBehaviour?: 'relaxed' | 'aggressive';
  /**
   * Constantly aggregated and weighted bandwidth samples are summed up to this weight limit to calculate an bandwidth estimation. Remaining samples (i.e. that would lead to exceeding the limit) are dropped from memory as they are not relevant anymore.
   * Default is 2000.
   *
   * @platform Android
   */
  bandwidthEstimateWeightLimit?: number;
  /**
   * Some devices have an incorrect implementation of MediaCodec.setOutputSurface. This leads to failure when the surface changes. To prevent failure, the codec will be released and re-instantiated in those scenarios.
   *
   * @platform Android
   */
  devicesThatRequireSurfaceWorkaround?: {
    /**
     * A device name as reported by Build.DEVICE.
     *
     * @see Build.DEVICE: https://developer.android.com/reference/kotlin/android/os/Build.html#DEVICE--
     */
    deviceNames?: string[]; // Mapped to an array of `DeviceName`s in Kotlin
    /**
     * A model name as reported by Build.MODEL.
     *
     * @see Build.MODEL: https://developer.android.com/reference/kotlin/android/os/Build.html#MODEL--
     */
    modelNames?: string[]; // Mapped to an array of `ModelName`s in Kotlin
  };
  /**
   * Specifies if the language property on DASH Representations, HLS Renditions and SmoothStreaming QualityLevels is normalized.
   * If enabled, language properties are normalized to IETF BCP 47 language tags. Default is true.
   *
   * Examples:
   * - "ENG" is normalized to "en"
   * - "en_us" is normalized to "en-us"
   * - "en-US-x-lvariant-POSIX" is normalized to "en-us-posix"
   *
   * @platform Android
   */
  languagePropertyNormalization?: boolean;
  /**
   * The interval in which dynamic DASH windows are updated locally. I.e. The rate by which the
   * playback window is moved forward on the timeline.
   *
   * @platform Android
   */
  localDynamicDashWindowUpdateInterval?: number;
  /**
   * Specifies whether default positioning values should be assumed when parsing TTML regions in case of
   * unsupported TTML features. Default is true
   *
   * @platform Android
   */
  shouldApplyTtmlRegionWorkaround?: boolean;
  /**
   * Specifies whether a DRM session should be used for clear tracks of type video and audio. Using
   * DRM sessions for clear content avoids the recreation of decoders when transitioning between clear
   * and encrypted sections of content. Default is false.
   *
   * @platform Android
   */
  useDrmSessionForClearPeriods?: boolean;
  /**
   * Specifies whether a DRM session should be used for clear tracks of type video and audio in a clear
   * source that follows after a DRM protected source. In addition, a DRM session will be used for clear
   * periods in a DRM protected source. Using DRM sessions for clear content avoids the recreation of
   * decoders when transitioning between clear and encrypted sections of content. Default is false.
   *
   * @platform Android
   */
  useDrmSessionForClearSources?: boolean;
  /**
   * Specifies if the player should always fall back to an extractor matching the file type, if no
   * matching extractor was found. If the fallback is applied, this will ignore potential incompatibilities
   * with streams and thus can result in unstable or failing playback.
   *
   * @platform Android
   */
  useFiletypeExtractorFallbackForHls?: boolean;
}
