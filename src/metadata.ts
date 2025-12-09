import { TimeRange, Seconds } from './utils/temporal';

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

export type Base64String = string;
export type CueingOption = 'PRE' | 'POST' | 'ONCE';

interface BaseDateRangeMetadataEntry<TPlatform extends 'ios' | 'android'> {
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
 * @platform Android
 */
export interface AndroidDateRangeMetadataEntry
  extends BaseDateRangeMetadataEntry<'android'> {
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
}

/**
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 *
 * @platform iOS, tvOS
 */
export interface IosDateRangeMetadataEntry
  extends BaseDateRangeMetadataEntry<'ios'> {
  /**
   * Time range of the entry relative to Unix Epoch.
   *
   * If the metadata represents an instantaneous event, {@link TimeRange.end} should be equal
   * to {@link TimeRange.start}.
   * An omitted {@link TimeRange.end} indicates an open-ended range.
   */
  absoluteTimeRange: TimeRange<Seconds>;
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
  cueingOptions: CueingOption[];
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
 * Describes metadata associated with HLS `#EXT-X-SCTE35` tags.
 *
 * @remarks On iOS, {@link TweaksConfig.isNativeHlsParsingEnabled} must be enabled
 *          to parse this type of metadata.
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
 *
 * This is a discriminated union over the `platform` field:
 *
 * - `"ios"`: {@link IosDateRangeMetadataEntry}
 * - `"android"`: {@link AndroidDateRangeMetadataEntry}
 *
 * Narrowing on `platform` gives you access to the platform-specific fields.
 */
export type DateRangeMetadataEntry =
  | IosDateRangeMetadataEntry
  | AndroidDateRangeMetadataEntry;

/**
 * Union type representing all supported timed metadata entry kinds.
 *
 * This is a discriminated union over the `metadataType` field:
 *
 * - {@link MetadataType.DATERANGE}: {@link DateRangeMetadataEntry}
 * - {@link MetadataType.SCTE}: {@link ScteMetadataEntry}
 *
 * Branching on `metadataType` using an `if`/`switch` statement narrows the type and
 * gives access to entry-specific fields.
 * 
 * @example
 * ```ts
 * function handleMetadata(entry: MetadataEntry) {
 *   switch (entry.metadataType) {
 *     case MetadataType.DATERANGE:
 *       // `entry` is a DateRangeMetadataEntry
 *       if (entry.platform === 'android') {
 *         // `entry` is now an AndroidDateRangeMetadataEntry
 *         console.log('End on next:', entry.endOnNext);
 *       } else {
 *         // `entry` is now an IosDateRangeMetadataEntry
 *         console.log('Cueing options:', entry.cueingOptions);
 *       }
 *       break;
 *
 *     case MetadataType.SCTE:
 *       // `entry` is a ScteMetadataEntry
 *       console.log('SCTE key:', entry.key, 'value:', entry.value);
 *       break;
 *   }
 * }
 * ```
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
