import type { TimelineReferencePoint } from '../source';

/**
 * Describes a position within a {@link Source} to seek to via {@link PlaylistApi.seekTo}.
 */
export interface SeekTarget {
  /**
   * The position where playback should seek to. The provided number can be:
   * - positive for {@link TimelineReferencePoint.START}
   * - negative for {@link TimelineReferencePoint.END}
   * - `0` for seeking to the reference point.
   *
   * Invalid numbers are corrected according to stream boundaries.
   */
  offset: number;
  /**
   * The timeline reference point to calculate {@link SeekTarget.offset} from.
   *
   * @defaultValue VoD: `TimelineReferencePoint.START`, live: `TimelineReferencePoint.END`
   */
  startOffsetTimelineReference?: TimelineReferencePoint;
}
