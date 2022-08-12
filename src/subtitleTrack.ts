/**
 * Supported subtitle/caption file formats.
 */
export enum SubtitleFormat {
  WEBVTT = 'webVtt',
  TTML = 'ttml',
  CEA = 'cea',
}

/**
 * Represents a custom subtitle track source that can be added to `SourceConfig.subtitleTracks`.
 */
export interface SubtitleTrack {
  /**
   * The URL to the timed file, e.g. WebVTT file.
   */
  url: string;
  /**
   * The label for this track.
   */
  label: string;
  /**
   * The unique identifier for this track.
   */
  identifier: string;
  /**
   * Specifies the file format to be used by this track.
   */
  format?: SubtitleFormat;
  /**
   * If set to true, this track would be considered as default. Default is `false`.
   */
  isDefault?: boolean;
  /**
   * The IETF BCP 47 language tag associated with this track, e.g. `pt`, `en`, `es` etc.
   */
  language?: string;
}
