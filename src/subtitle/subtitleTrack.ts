import { MakeRequired } from '../utils';

/**
 * Supported subtitle/caption file formats.
 */
export enum SubtitleFormat {
  CEA = 'cea',
  TTML = 'ttml',
  VTT = 'vtt',
}

/**
 * Represents a custom subtitle track source that can be added to `SourceConfig.subtitleTracks`.
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
 * Helper type that represents an entry in the `SourceConfig.addSubtitleTracks` list.
 *
 * Since `SubtitleTrack` has all of its properties as optionals for total compatibility with
 * values that may be sent from native code, this type serves as a reinforcer of what properties
 * should be required during the registration of an external subtitle track from JS.
 */
export type AddSubtitleTrack = MakeRequired<
  SubtitleTrack,
  'url' | 'label' | 'language'
>;
