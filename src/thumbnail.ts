/**
 * Represents a VTT thumbnail.
 */
export interface Thumbnail {
  /**
   * The start time of the thumbnail.
   */
  start: number;
  /**
   * The end time of the thumbnail.
   */
  end: number;
  /**
   * The raw cue data.
   */
  text: string;
  /**
   * The URL of the spritesheet
   */
  url: string;
  /**
   * The horizontal offset of the thumbnail in its spritesheet
   */
  x: number;
  /**
   * The vertical offset of the thumbnail in its spritesheet
   */
  y: number;
  /**
   * The width of the thumbnail
   */
  width: number;
  /**
   * The height of the thumbnail
   */
  height: number;
}
