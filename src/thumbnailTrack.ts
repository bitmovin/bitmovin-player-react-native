import { MakeRequired } from './utils';

/**
 * Represents a custom subtitle track source that can be added to `SourceConfig.subtitleTracks`.
 */
export interface ThumbnailTrack {
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
}

/**
 * Helper type that represents an entry in `SourceConfig.thumbnailTrack` list.
 *
 * Since `ThumbnailTrack` has all of its properties as optionals for total compatibility with
 * values that may be sent from native code, this type serves as a reinforcer of what properties
 * should be required during the registration of an external thumbnail track from JS.
 */
export type SideLoadedThumbnailTrack = MakeRequired<
  ThumbnailTrack,
  'url' | 'label'
>;
