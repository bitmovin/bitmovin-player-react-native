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
