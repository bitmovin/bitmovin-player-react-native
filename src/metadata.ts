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
   * The start date of the date range, in milliseconds.
   */
  startDate: number;
  /**
   * The end date of the date range, in milliseconds.
   * 
   * If the metadata represents an instantaneous event, `endDate` should be equal
   * to {@link startDate}.  
   * An omitted `endDate` indicates an open-ended range.
   * 
   * @platform iOS, tvOS
   */
  endDate?: number;
  /**
   * The declared duration of the range.
   * 
   * @platform Android
   */
  duration?: number;
  /**
   * The planned duration of the range.
   * 
   * @platform Android
   */
  plannedDuration?: number;
  /**
   * Indicates whether the date range ends at the start of the next date range with the same {@link classLabel}.
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
   * Note: Applies only to HLS Interstitial opportunities (pre-, mid-, post-roll).
   * 
   * @platform iOS, tvOS
   */
  cueingOptions?: string[];
  /**
   * Custom client-defined attributes associated with the date range.
   * 
   * @platform Android
   */
  clientAttributes?: Record<string, string>;
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
export type MetadataEntry =
  | DateRangeMetadataEntry
  | ScteMetadataEntry;

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
