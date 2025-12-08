import { TimeRange, Seconds, Milliseconds } from "./utils/temporal";

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

export type Base64String = string;// TODO: could be branded?
export type CueingOption = 'PRE' | 'POST' | 'ONCE';

interface BaseDateRangeMetadataEntry<TPlatform extends 'ios' | 'android'> {// TODO: do the same for ID3
  metadataType: MetadataType.DATERANGE;
  /**
   * Platform discriminator for TypeScript type narrowing.
   */
  platform: TPlatform;
  /**
   * The unique identifier for the date range.
   */
  id: string;
  /**
   * The class associated with the date range.
   */
  classLabel?: string;
  /**
   * The declared duration of the range.
   */
  duration?: Seconds;
}

/**
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 * 
 * @platform Android
 */
export interface AndroidDateRangeMetadataEntry extends BaseDateRangeMetadataEntry<'android'> {
  /**
   * Time range of the entry relative to the beginning of the playback.
   */
  relativeTimeRange: TimeRange<Seconds>;
  /**
   * The planned duration of the range.
   *
   * Used for live streams where the actual end time may not be known yet.
   */
  plannedDuration?: Seconds;
  /**
   * Indicates whether the date range ends at the start of the next date range
   * with the same {@link classLabel}.
   */
  endOnNext: boolean;
  /**
   * All the attributes associated with the date range.
   * 
   * @example "X-ASSET-URI": "https://www.example.com"
   */
  attributes: Record<string, string>;
}

/**
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 * 
 * @platform iOS, tvOS
 */
export interface IosDateRangeMetadataEntry extends BaseDateRangeMetadataEntry<'ios'> {
  platform: 'ios';
  /**
   * Time range of the entry relative to Unix Epoch.
   *
   * If the metadata represents an instantaneous event, {@link TimeRange.end} should be equal
   * to {@link TimeRange.start}.
   * An omitted {@link TimeRange.end} indicates an open-ended range.
   */
  absoluteTimeRange: TimeRange<Milliseconds>;
  /**
   * The `CUE` attribute values from an `#EXT-X-DATERANGE` tag.
   *
   * Empty array if the attribute is not present.
   * `"PRE"` triggers before playback; `"POST"` triggers after completion; `"ONCE"` limits triggering to once.
   * When multiple values are provided, the first takes precedence (e.g., `"PRE,POST"` -> `"PRE"`).
   * `"PRE"` and `"POST"` are re-playable unless `"ONCE"` is included.
   *
   * @remarks Applies only to HLS Interstitial opportunities (pre-, mid-, post-roll).
   */
  cueingOptions: CueingOption[]; // TODO: check type casting works
  /**
   * All the attributes associated with the date range.
   */
  attributes: BaseIosMetadataItem[];// TODO: Same property name on both platforms, incompatible types.
}

/**
 * Typed representations of an iOS metadata value.
 *
 * Depending on the underlying value, one or more of these fields may be present;
 * others will be `undefined`.
 */
export interface IosMetadataValue {
  /**
   * A text representation of the value, if available.
   */
  stringValue?: string;
  /**
   * A numeric representation of the value, if available.
   */
  numberValue?: number;
  /**
   * A date/time representation of the value, formatted as an ISO 8601 string, if available.
   * 
   * @example "2025-12-02T00:00:00Z"
   */
  dateValue?: string;
  /**
   * A binary representation of the value as Base64-encoded data, if available.
   *
   * @remarks Use this accessor to retrieve encapsulated artwork, thumbnails,
   *          proprietary frames, or any encoded value.
   */
  dataValue?: Base64String;
}

/**
 * iOS representation of generic metadata items.
 *
 * @platform iOS, tvOS
 */
interface BaseIosMetadataItem {
  /**
   * Platform discriminator for TypeScript type narrowing.
   */
  platform: 'ios';
  /**
   * The metadata key indicated by the identifier. For example, "TXXX".
   */
  key?: string;
  /**
   * String representation of the metadata value.
   *
   * The underlying value is first interpreted as the most appropriate type
   * (date, number, text, or binary data) and then converted to a string.
   * - Dates are formatted as ISO 8601 strings (e.g. "2025-12-02T00:00:00Z").
   * - Binary data is encoded as a Base64 string.
   *
   * This will be `undefined` if the value cannot be interpreted.
   */
  value?: string;
  /**
   * Full typed representation of the underlying value as reported by iOS.
   */
  rawValue?: IosMetadataValue;
  /**
   * Time range of the entry relative to the beginning of the playback.
   */
  relativeTimeRange?: TimeRange<Seconds>;// TODO: is this seconds??
  /**
   * The duration of the metadata item.
   */
  duration?: Seconds;
  /**
   * The IETF BCP 47 language identifier of the metadata item.
   */
  extendedLanguageTag?: string;
}

/**
 * Describes metadata associated with HLS `#EXT-X-SCTE35` tags.
 *
 * Note: On iOS, {@link TweaksConfig.isNativeHlsParsingEnabled} must be enabled to parse this type of metadata.
 */
export interface ScteMetadataEntry {
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
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 */
export type DateRangeMetadataEntry =// TODO: document usage: split/branch (if/else, switch) on discriminator (platform) to narrow down types and get more fields
  | IosDateRangeMetadataEntry
  | AndroidDateRangeMetadataEntry;

/**
 * Union type representing all supported timed metadata entry kinds.
 */
export type MetadataEntry = DateRangeMetadataEntry | ScteMetadataEntry;

/**
 * A collection of timed metadata entries of the same type.
 *
 * All entries in the collection share the same `metadataType`.
 */
export interface MetadataCollection<T extends MetadataEntry> {
  /**
   * The playback time in seconds when this metadata should trigger, relative to the playback session.
   */
  startTime?: Seconds;
  /**
   * The metadata entries.
   * 
   * The group is homogeneous: all entries share the same metadata type.
   */
  entries: T[];
}
