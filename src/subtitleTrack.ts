/**
 * Supported subtitle/caption file formats.
 * @platform Android, iOS, tvOS
 */
export enum SubtitleFormat {
  /**
   * Closed Captioning (CEA) subtitle format.
   * @platform Android, iOS, tvOS
   */
  CEA = 'cea',
  /**
   * Timed Text Markup Language (TTML) subtitle format.
   * @platform Android, iOS, tvOS
   */
  TTML = 'ttml',
  /**
   * Web Video Text Tracks Format (WebVTT) subtitle format.
   * @platform Android, iOS, tvOS
   */
  VTT = 'vtt',
  /**
   * SubRip (SRT) subtitle format.
   * @platform iOS, tvOS, tvOS
   */
  SRT = 'srt',
}

/**
 * Describes a subtitle track.
 * @platform Android, iOS, tvOS
 */
export interface SubtitleTrack {
  /**
   * The URL to the timed file, e.g. WebVTT file.
   */
  url?: string;
  /**
   * The label for this track.
   */
  label?: string;
  /**
   * The unique identifier for this track. If no value is provided, a random UUIDv4 will be generated for it.
   */
  identifier?: string;
  /**
   * Specifies the file format to be used by this track.
   */
  format?: SubtitleFormat;
  /**
   * If set to true, this track would be considered as default. Default is `false`.
   */
  isDefault?: boolean;
  /**
   * Tells if a subtitle track is forced. If set to `true` it means that the player should automatically
   * select and switch this subtitle according to the selected audio language. Forced subtitles do
   * not appear in `Player.getAvailableSubtitles`.
   *
   * Default is `false`.
   */
  isForced?: boolean;
  /**
   * The IETF BCP 47 language tag associated with this track, e.g. `pt`, `en`, `es` etc.
   */
  language?: string;
}

/**
 * A subtitle track that can be added to `SourceConfig.subtitleTracks`.
 */
export interface SideLoadedSubtitleTrack extends SubtitleTrack {
  url: string;
  label: string;
  language: string;
  format: SubtitleFormat;
}
