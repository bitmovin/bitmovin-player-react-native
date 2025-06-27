/**
 * Quality definition of a video representation.
 */
export interface VideoQuality {
  /**
   * The id of the media quality.
   */
  id: string;
  /**
   * The label of the media quality that should be exposed to the user.
   */
  label?: string;
  /**
   * The bitrate of the media quality.
   */
  bitrate?: number;
  /**
   * The codec of the media quality.
   */
  codec?: string;
  /**
   * The frame rate of the video quality. If the frame rate is not known or not applicable a value of -1 will be returned.
   */
  frameRate?: number;
  /**
   * The height of the video quality.
   */
  height?: number;
  /**
   * The width of the video quality.
   */
  width?: number;
}

/**
 * Quality definition of an audio representation.
 *
 * @platform Android
 */
export interface AudioQuality {
  /**
   * The id of the media quality.
   */
  id: string;
  /**
   * The label of the media quality that should be exposed to the user.
   */
  label?: string;
  /**
   * The bitrate in bits per second. This is the peak bitrate if known, or else the average bitrate
   * if known, or else -1.
   */
  bitrate?: number;
  /**
   * The average bitrate in bits per second, or -1 if unknown or not applicable. The
   * way in which this field is populated depends on the type of media to which the format
   * corresponds:
   *
   * - DASH representations: Always -1.
   * - HLS variants: The `AVERAGE-BANDWIDTH` attribute defined on the corresponding
   *   `EXT-X-STREAM-INF` tag in the multivariant playlist, or -1 if not present.
   * - SmoothStreaming track elements: The `Bitrate` attribute defined on the
   *   corresponding `TrackElement` in the manifest, or -1 if not present.
   * - Progressive container formats: Often -1, but may be populated with
   *   the average bitrate of the container if known.
   */
  averageBitrate?: number;
  /**
   * The peak bitrate in bits per second, or -1 if unknown or not applicable. The way
   * in which this field is populated depends on the type of media to which the format corresponds:
   *
   *  - DASH representations: The `@bandwidth` attribute of the corresponding
   *    `Representation` element in the manifest.
   *  - HLS variants: The `BANDWIDTH` attribute defined on the corresponding
   *    `EXT-X-STREAM-INF` tag.
   *  - SmoothStreaming track elements: Always -1.
   *  - Progressive container formats: Often -1, but may be populated with
   *    the peak bitrate of the container if known.
   */
  peakBitrate?: number;
  /**
   * The codec of the media quality.
   */
  codec?: string;
}
