/**
 * Represents the direction in which the cue text should be written.
 */
export enum CueDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL_LEFT_TO_RIGHT = 'leftToRight',
  VERTICAL_RIGHT_TO_LEFT = 'rightToLeft',
}

/**
 * Alignment options for text, line and position relative to the cue box.
 */
export enum CueAlignment {
  /**
   * Align item to the center.
   */
  CENTER = 'center',
  /**
   * Align item to the left.
   */
  LEFT = 'left',
  /**
   * Align item to the right.
   */
  RIGHT = 'right',
  /**
   * Align item relative to cue's box start position.
   */
  START = 'start',
  /**
   * Align item relative to cue's box end position.
   */
  END = 'end',
  /**
   * Unknown or automatic align value.
   */
  UNSET = 'unset',
}

/**
 * Represents the type value of value that should be considered for a line or position value.
 */
export enum CueValueType {
  /**
   * Value is automatically set so the number associated with line/position can be ignored.
   */
  AUTO = 'auto',
  /**
   * Value isn't automatically set so the number associated with line/position should be considered.
   */
  NUMERIC = 'numeric',
}

/**
 * Represents the vertical position of the cue box.
 */
export interface CueLine {
  /**
   * Alignment for the line property.
   */
  align: CueAlignment;
  /**
   * The line value type. Can be either `AUTO` or `NUMERIC`, for an actual numeric value.
   */
  type: CueValueType;
  /**
   * The actual value for the line property.
   * If type is set to `AUTO`, then this value should be ignored.
   */
  value: number;
}

/**
 * Represents the horizontal position of the cue box.
 */
export interface CueVttPosition {
  /**
   * Alignment for the position property.
   */
  align: CueAlignment;
  /**
   * The position value type. Can be either `AUTO` or `NUMERIC`, for an actual numberic value.
   */
  type: CueValueType;
  /**
   * The actual value for the position property.
   * If type is set to `AUTO`, then this value should be ignored.
   */
  value: number;
}

/**
 * Represents the positioning information for CEA captions.
 */
export interface CueCeaPosition {
  /**
   * Index of the row ranging from 0 to 14.
   */
  row: number;
  /**
   * Index of the column ranging from 0 to 31.
   */
  column: number;
}

/**
 * Represents a cue of a subtitle track.
 */
export interface Cue {
  /**
   * Direction in which the cue's text should be rendered.
   */
  direction?: CueDirection;
  /**
   * The end time of the cue in seconds.
   */
  end: number;
  /**
   * The cue text as HTML.
   */
  html?: string;
  /**
   * The vertical position of the cue box.
   */
  line?: CueLine;
  /**
   * The position of the cue for CEA-captions only.
   *
   * Provides information about where the cue should be positioned on a grid of 15 character rows
   * times 32 columns.
   *
   * Only available for iOS.
   */
  ceaPosition?: CueCeaPosition;
  /**
   * The VTT positioning properties for this cue.
   */
  vttPosition?: CueVttPosition;
  /**
   * The size of the cue box relative to the video dimensions.
   *
   * @remarks
   * If the writing direction is horizontal, then the size percentages are relative to the width of
   * the video, otherwise to the height of the video.
   */
  size?: number;
  /**
   * The start time of the cue in seconds.
   */
  start: number;
  /**
   * The cue text.
   */
  text?: string;
  /**
   * The anchor point in which text should be rendered.
   */
  textAlignment?: CueAlignment;
}
