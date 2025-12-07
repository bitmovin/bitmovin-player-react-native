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
  attributes?: Record<string, string> | [AvMetadataItemEntry];// TODO: update docs (or else use Record<string, unknown> for both)
}

/**
 * Typed representations of an iOS metadata value.
 *
 * Depending on the underlying value, one or more of these fields may be present; others will be `undefined`.
 */
export interface IOSMetadataValue {
  /**
   * Provides a string representation of the value, or `undefined`
   * if the value cannot be represented as such.
   */
  stringValue?: string;
  /**
   * Provides a numerical representation of the value, or `undefined`
   * if the value cannot be represented as such.
   */
  numberValue?: number;
  /**
   * Provides the value as an ISO 8601 date string (e.g.: "2025-12-02T00:00:00Z"), or `undefined`
   * if the value cannot be represented as such.
   */
  dateValue?: string;
  /**
   * Provides the value as Base64-encoded data, or `undefined` when the value cannot be represented as data.
   *
   * Use this accessor to retrieve encapsulated artwork, thumbnails, proprietary frames, or any encoded value.
   */
  dataValue?: string;
}

/**
 * iOS representation of ID3 and generic metadata items.
 *
 * @platform iOS, tvOS
 */
export interface AvMetadataItemEntry extends BaseMetadataEntry {
  metadataType: MetadataType.ID3;// TODO: this can also be DateRange !! or generic - how to solve??
  /**
   * Platform discriminator for TypeScript type narrowing.
   */
  platform: 'ios';
  /**
   * The metadata key indicated by the identifier. For example, "TXXX".
   */
  key?: string;
  /**
   * Parsed representation of the metadata item's value.
   *
   * If the underlying metadata item has no readable value, this property is `undefined`.
   */
  value?: string | IOSMetadataValue; // TODO: update docs
  /**
   * Time range of the entry relative to the beginning of the playback.
   */
  relativeTimeRange?: RelativeTimeRange;
  /**
   * The duration of the metadata item.
   */
  duration?: Seconds;
  /**
   * The IETF BCP 47 language identifier of the metadata item.
   */
  extendedLanguageTag?: string;
  /**
   * Additional attributes attached to the metadata item.
   * 
   * `undefined` in case {@link metadataType} is {@link MetadataType.DATERANGE}.
   */
  extraAttributes?: Record<string, unknown>;
}

/**
 * Base interface for all Android ID3 frames.
 *
 * @platform Android
 */
interface AndroidId3FrameBase extends BaseMetadataEntry {
  metadataType: MetadataType.ID3;
  /**
   * Platform discriminator for TypeScript type narrowing.
   */
  platform: 'android';
  id: string;
}

/**
 * Stores text-based metadata.
 *
 * @platform Android
 */
export interface AndroidTextInformationFrame extends AndroidId3FrameBase {
  frameType: 'text';
  description?: string;
  value: string;
}

/**
 * Encapsulates raw binary data.
 *
 * @platform Android
 */
export interface AndroidBinaryFrame extends AndroidId3FrameBase {
  frameType: 'binary';
  /** Base64-encoded binary data. */
  data: string;
}

/**
 * Encapsulates an attached picture.
 *
 * @platform Android
 */
export interface AndroidApicFrame extends AndroidId3FrameBase {
  frameType: 'apic';
  mimeType: string;
  description?: string;
  pictureType: number;
  /** Base64-encoded image data. */
  pictureData: string;
}

/**
 * Stores an external resource via URL.
 *
 * @platform Android
 */
export interface AndroidUrlLinkFrame extends AndroidId3FrameBase {
  frameType: 'url';
  description?: string;
  url: string;
}

/**
 * Stores user comments or notes.
 *
 * @platform Android
 */
export interface AndroidCommentFrame extends AndroidId3FrameBase {
  frameType: 'comment';
  language: string;
  description: string;
  text: string;
}

/**
 * Encapsulates application-specific proprietary data owned by a registered owner.
 *
 * @platform Android
 */
export interface AndroidPrivFrame extends AndroidId3FrameBase {
  frameType: 'priv';
  owner: string;
  /** Base64-encoded private data. */
  privateData: string;
}

/**
 * Encapsulates arbitrary binary objects with metadata.
 *
 * @platform Android
 */
export interface AndroidGeobFrame extends AndroidId3FrameBase {
  frameType: 'geob';
  mimeType: string;
  filename: string;
  description: string;
  /** Base64-encoded object data. */
  data: string;
}

/**
 * Defines a content chapter.
 *
 * @platform Android
 */
export interface AndroidChapterFrame extends AndroidId3FrameBase {
  frameType: 'chapter';
  chapterId: string;
  startTimeMs: number;// TODO: use Milliseconds and rename properly
  endTimeMs: number;
  /** The byte offset of the start of the chapter, or `-1` if not set. */
  startOffset: number;
  /** The byte offset of the end of the chapter, or `-1` if not set. */
  endOffset: number;
  subFrames: AndroidId3Frame[];
}

/**
 * Defines hierarchical chapter structure.
 *
 * @platform Android
 */
export interface AndroidChapterTocFrame extends AndroidId3FrameBase {
  frameType: 'chapterToc';
  elementId: string;
  isRoot: boolean;
  isOrdered: boolean;
  children: string[];
  subFrames: AndroidId3Frame[];
}

/**
 * Android representation of ID3 metadata items.
 *
 * @platform Android
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
 *
 * @example
 * ```ts
 * function processMetadata(entry: Id3MetadataEntry) {
 *   if (entry.platform === 'android') {
 *     // TypeScript narrows to AndroidId3Frame
 *     console.log(entry.frameType); // Type-safe
 *   } else {
 *     // TypeScript narrows to AvMetadataItemEntry (iOS)
 *     console.log(entry.keySpace);  // Type-safe
 *   }
 * }
 * ```
 */
export type Id3MetadataEntry = AvMetadataItemEntry | AndroidId3Frame;// TODO: if AVMetadataItem becomes generic, does this need changes as well?? - maybe could use A base avItemMetadata to inherit (e.g. extraAttributes is only ID3, then use ID3 child here)

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
export type MetadataEntry = DateRangeMetadataEntry | Id3MetadataEntry | ScteMetadataEntry;

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
