import { MediaTrackRole } from './mediaTrackRole';
import { AudioQuality } from './media';

/**
 * Represents an audio track for a video.
 */
export interface AudioTrack {
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
   * If set to true, this track would be considered as default. Default is `false`.
   */
  isDefault?: boolean;
  /**
   * The IETF BCP 47 language tag associated with this track, e.g. `pt`, `en`, `es` etc.
   */
  language?: string;
  /**
   * An array of {@link MediaTrackRole} objects, each describing a specific role or characteristic of the audio track.
   * This property provides a unified way to understand track purposes (e.g., for accessibility) across platforms.
   */
  roles?: MediaTrackRole[];

  /**
   * A list of AudioQuality associated with this AudioTrack.
   * @platform Android
   */
  qualities?: AudioQuality[];
}
