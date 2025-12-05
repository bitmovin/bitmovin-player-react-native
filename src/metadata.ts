/**
 * Enumerates all supported types of timed metadata entries.
 */
export enum MetadataType {
  ID3 = 'ID3',
  EMSG = 'EMSG',
  SCTE = 'SCTE',
  DATERANGE = 'DATERANGE',
  NONE = 'NONE',
}

export interface BaseMetadataEntry {
  metadataType: MetadataType;
}

export type Milliseconds = number;
export type Seconds = number;

/**
 * Time range expressed in milliseconds since Unix epoch.
 */
export interface AbsoluteTimeRange {
  /**
   * The start date of the range.
   */
  start?: Milliseconds;
  /**
   * The end date of the range.
   */
  end?: Milliseconds;
}

/**
 * Time range expressed in seconds since playback start.
 */
export interface RelativeTimeRange {
  /**
   * The start time of the range.
   */
  start?: Seconds;
  /**
   * The end time of the range.
   */
  end?: Seconds;
}

/**
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 */
export interface DateRangeMetadataEntry extends BaseMetadataEntry {
  metadataType: MetadataType.DATERANGE;
  /**
   * The unique identifier for the date range.
   */
  id: string;
  /**
   * The class associated with the date range.
   */
  classLabel?: string;
  /**
   * Time range of the entry relative to Unix Epoch.
   *
   * If the metadata represents an instantaneous event, {@link AbsoluteTimeRange.end} should be equal
   * to {@link AbsoluteTimeRange.start}.
   * An omitted {@link AbsoluteTimeRange.end} indicates an open-ended range.
   *
   * @platform iOS, tvOS
   */
  absoluteTimeRange?: AbsoluteTimeRange;
  /**
   * Time range of the entry relative to the beginning of the playback.
   *
   * @platform Android
   */
  relativeTimeRange?: RelativeTimeRange;
  /**
   * The declared duration of the range in seconds.
   */
  duration?: Seconds;
  /**
   * The planned duration of the range in seconds.
   *
   * Used for live streams where the actual end time may not be known yet.
   *
   * @platform Android
   */
  plannedDuration?: Seconds;
  /**
   * Indicates whether the date range ends at the start of the next date range
   * with the same {@link classLabel}.
   *
   * @platform Android
   */
  endOnNext?: boolean;
  /**
   * The `CUE` attribute values from an `#EXT-X-DATERANGE` tag.
   *
   * Empty array if the attribute is not present.
   * `"PRE"` triggers before playback; `"POST"` triggers after completion; `"ONCE"` limits triggering to once.
   * When multiple values are provided, the first takes precedence (e.g., `"PRE,POST"` -> `"PRE"`).
   * `"PRE"` and `"POST"` are re-playable unless `"ONCE"` is included.
   *
   * @remarks Applies only to HLS Interstitial opportunities (pre-, mid-, post-roll).
   *
   * @platform iOS, tvOS
   */
  cueingOptions?: string[];
  /**
   * All the attributes associated with the date range.
   */
  attributes?: Record<string, string>;
}

/**
 * Describes metadata associated with HLS `#EXT-X-SCTE35` tags.
 *
 * Note: On iOS, {@link TweaksConfig.isNativeHlsParsingEnabled} must be enabled to parse this type of metadata.
 */
export interface ScteMetadataEntry extends BaseMetadataEntry {
  metadataType: MetadataType.SCTE;
  /**
   * The attribute name/key from the SCTE-35 tag.
   */
  key: string;
  /**
   * The attribute value (nullable for key-only attributes).
   */
  value?: string;
}

/**
 * Union type representing all supported timed metadata entry kinds.
 */
export type MetadataEntry = DateRangeMetadataEntry | ScteMetadataEntry;

/**
 * A collection of timed metadata entries.
 */
export interface Metadata<T extends BaseMetadataEntry = MetadataEntry> {
  metadataType: MetadataType;
  /**
   * The playback time in seconds when this metadata should trigger, relative to the playback session.
   */
  startTime: number;
  entries: T[];
}
