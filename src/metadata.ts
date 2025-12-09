import { TimeRange, Seconds, Milliseconds } from './utils/temporal';

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

/**
 * Base64-encoded raw data without a `data:...;base64,` prefix.
 */
export type Base64Raw = string;
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
   * The declared duration of the range in seconds.
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
   * Time range of the entry relative to the beginning of the playback, in seconds.
   */
  relativeTimeRange: TimeRange<Seconds>;
  /**
   * The planned duration of the range in seconds.
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
   * Time range of the entry relative to Unix Epoch, in seconds.
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
   * A binary representation of the value as raw Base64-encoded data, if available.
   *
   * @remarks Use this accessor to retrieve encapsulated artwork, thumbnails,
   *          proprietary frames, or any encoded value.
   */
  dataValue?: Base64Raw;
}

/**
 * iOS representation of ID3 metadata items.
 *
 * @platform iOS, tvOS
 */
interface IosId3Frame {
  metadataType: MetadataType.ID3;
  /**
   * Platform discriminator for TypeScript type narrowing.
   */
  platform: 'ios';
  /**
   * ID3 frame identifier.
   *
   * @example "TXXX"
   */
  id?: string;
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
   * Time range of the entry relative to the beginning of the playback, in seconds.
   */
  relativeTimeRange?: TimeRange<Seconds>;
  /**
   * The duration of the metadata item in seconds.
   */
  duration?: Seconds;
  /**
   * The IETF BCP 47 language identifier of the metadata item.
   */
  extendedLanguageTag?: string;
  /**
   * Additional attributes attached to the metadata item.
   */
  extraAttributes?: Record<string, unknown>;
}

/**
 * Base interface for all Android ID3 frames.
 *
 * @platform Android
 */
interface AndroidId3FrameBase {
  metadataType: MetadataType.ID3;
  /**
   * Platform discriminator for TypeScript type narrowing.
   */
  platform: 'android';
  /**
   * ID3 frame identifier.
   *
   * @example "TXXX"
   */
  id: string;
}

/**
 * Stores text-based metadata.
 *
 * @platform Android
 */
interface AndroidTextInformationFrame extends AndroidId3FrameBase {
  frameType: 'text';
  description?: string;
  value: string;
}

/**
 * Encapsulates an ID3 frame whose payload is treated as opaque binary data.
 *
 * @platform Android
 */
interface AndroidBinaryFrame extends AndroidId3FrameBase {
  frameType: 'binary';
  /** Raw frame payload encoded as Base64 (no data: URI prefix). */
  data: Base64Raw;
}

/**
 * Encapsulates an attached picture.
 *
 * @platform Android
 */
interface AndroidApicFrame extends AndroidId3FrameBase {
  frameType: 'apic';
  /**
   * MIME type of the embedded image as stored in the APIC frame.
   *
   * @example "image/jpeg"
   */
  mimeType: string;
  description?: string;
  /**
   * Picture type as defined by the ID3 specification.
   *
   * @example 3 (front cover)
   */
  pictureType: number;
  /** Raw image data encoded as Base64 (no data: URI prefix). */
  pictureData: Base64Raw;
}

/**
 * Stores an external resource via URL.
 *
 * @platform Android
 */
interface AndroidUrlLinkFrame extends AndroidId3FrameBase {
  frameType: 'url';
  description?: string;
  url: string;
}

/**
 * Stores user comments or notes.
 *
 * @platform Android
 */
interface AndroidCommentFrame extends AndroidId3FrameBase {
  frameType: 'comment';
  language: string;
  description: string;
  /** The comment text. */
  text: string;
}

/**
 * Encapsulates owner-specific private data.
 *
 * The structure and semantics of the payload are defined solely by the `owner`
 * identifier and are opaque to generic parsers.
 *
 * @platform Android
 */
interface AndroidPrivFrame extends AndroidId3FrameBase {
  frameType: 'priv';
  /**
   * Owner identifier string.
   *
   * Typically a reverse-DNS or application-specific identifier.
   *
   * @example "com.example.app"
   */
  owner: string;
  /**
   * Raw private payload encoded as Base64 (no data: URI prefix).
   * Consumers should only attempt to interpret this data if they recognize
   * and understand the corresponding {@link owner} value.
   */
  privateData: Base64Raw;
}

/**
 * Encapsulates arbitrary binary objects with metadata.
 *
 * @platform Android
 */
interface AndroidGeobFrame extends AndroidId3FrameBase {
  frameType: 'geob';
  /**
   * MIME type of the encapsulated object.
   *
   * @example "application/octet-stream"
   */
  mimeType: string;
  /** Original filename of the object. */
  filename: string;
  description: string;
  /**
   * Raw object data encoded as Base64 (no data: URI prefix).
   */
  data: Base64Raw;
}

/**
 * Defines a content chapter.
 *
 * @platform Android
 */
interface AndroidChapterFrame extends AndroidId3FrameBase {
  frameType: 'chapter';
  /** Identifier of the chapter element. */
  chapterId: string;
  /** Time range of the chapter in milliseconds. */
  timeRange: TimeRange<Milliseconds>;
  /** The byte offset of the start of the chapter, or `-1` if not set. */
  startOffset: number;
  /** The byte offset of the end of the chapter, or `-1` if not set. */
  endOffset: number;
  /**
   * Nested ID3 subframes associated with this chapter (e.g. title, URL, etc.).
   */
  subFrames: AndroidId3Frame[];
}

/**
 * Defines hierarchical chapter structure.
 *
 * @platform Android
 */
interface AndroidChapterTocFrame extends AndroidId3FrameBase {
  frameType: 'chapterToc';
  /** Identifier of the table-of-contents element. */
  elementId: string;
  /** Whether this element is the root of the chapter tree. */
  isRoot: boolean;
  /** Whether the listed children are ordered. */
  isOrdered: boolean;
  /** IDs of child chapter or TOC elements. */
  children: string[];
  /**
   * Nested ID3 subframes associated with this TOC element.
   */
  subFrames: AndroidId3Frame[];
}

/**
 * Android representation of ID3 metadata items.
 *
 * This is a discriminated union of Android ID3 frame types. Use {@link isAndroidId3Frame}
 * for type-safe narrowing to specific frame types.
 *
 * @platform Android
 * @see {@link isAndroidId3Frame} for frame type narrowing
 */
export type AndroidId3Frame =
  | AndroidTextInformationFrame
  | AndroidBinaryFrame
  | AndroidApicFrame
  | AndroidUrlLinkFrame
  | AndroidCommentFrame
  | AndroidPrivFrame
  | AndroidGeobFrame
  | AndroidChapterFrame
  | AndroidChapterTocFrame;

/**
 * Describes metadata associated with ID3 tags.
 *
 * This is a discriminated union of iOS and Android ID3 representations.
 * The `platform` field acts as the discriminator, allowing TypeScript to
 * automatically narrow to the correct platform-specific type.
 */
export type Id3MetadataEntry = IosId3Frame | AndroidId3Frame;

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
 * - {@link MetadataType.ID3}: {@link Id3MetadataEntry}
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
 *
 *     case MetadataType.ID3:
 *       // `entry` is an Id3MetadataEntry
 *       if (entry.platform === 'android') {
 *         // `entry` is now an AndroidId3Frame
 *         console.log('Frame type:', entry.frameType);
 *         // Further narrow down on the frame type
 *         if (entry.frameType == 'apic') {
 *           console.log('APIC frame mimeType: ', entry.mimeType)
 *         }
 *       } else {
 *         // `entry` is now an IosId3Frame
 *         console.log('Frame ID:', entry.id, 'Value:', entry.value);
 *       }
 *       // Or use isAndroidId3Frame to directly narrow to specific Android frame
 *       if (isAndroidId3Frame(entry, 'text')) {
 *         console.log('Text frame:', entry.value);
 *       }
 *       break;
 *   }
 * }
 * ```
 */
export type MetadataEntry =
  | DateRangeMetadataEntry
  | Id3MetadataEntry
  | ScteMetadataEntry;

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

/**
 * Type-safe narrowing helper for Android ID3 frame types.
 *
 * Android ID3 frames have 9 distinct frame types (text, binary, apic, url, comment,
 * priv, geob, chapter, chapterToc), each with different fields. This helper provides
 * type-safe access to frame-specific properties.
 *
 * @param entry - The ID3 metadata entry to check
 * @param frameType - The Android frame type to narrow to
 * @returns `true` if entry is an Android frame of the specified type
 *
 * @see {@link MetadataEntry} for the full type narrowing documentation
 */
export function isAndroidId3Frame<T extends AndroidId3Frame['frameType']>(
  entry: Id3MetadataEntry,
  frameType: T
): entry is Extract<AndroidId3Frame, { frameType: T }> {
  return entry.platform === 'android' && entry.frameType === frameType;
}
