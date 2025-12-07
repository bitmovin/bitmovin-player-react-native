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

/**
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 */
export type DateRangeMetadataEntry =
  | IosDateRangeMetadataEntry
  | AndroidDateRangeMetadataEntry;

/**
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 * 
 * @platform Android
 */
export interface AndroidDateRangeMetadataEntry {
  platform: 'android';
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
   * Time range of the entry relative to the beginning of the playback.
   */
  relativeTimeRange?: TimeRange<Seconds>;
  /**
   * The declared duration of the range.
   */
  duration?: Seconds;
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
  endOnNext?: boolean;
  /**
   * All the attributes associated with the date range.
   * 
   * @example "X-ASSET-URI": "https://www.example.com"
   */
  attributes?: Record<string, string>;
}

/**
 * Represents in-playlist timed metadata from an HLS `#EXT-X-DATERANGE` tag.
 * 
 * @platform iOS, tvOS
 */
export interface IosDateRangeMetadataEntry {
  platform: 'ios';
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
   * If the metadata represents an instantaneous event, {@link TimeRange.end} should be equal
   * to {@link TimeRange.start}.
   * An omitted {@link TimeRange.end} indicates an open-ended range.
   */
  absoluteTimeRange?: TimeRange<Milliseconds>;
  /**
   * The declared duration of the range.
   */
  duration?: Seconds;
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
  cueingOptions?: string[];
  /**
   * All the attributes associated with the date range.
   */
  attributes?: IosDateRangeMetadataItemEntry[];
}

/**
 * Typed representations of an iOS metadata value.
 *
 * Depending on the underlying value, one or more of these fields may be present;
 * others will be `undefined`.
 */
export interface IOSMetadataValue {
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
  rawValue?: IOSMetadataValue;
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
 * iOS representation of ID3 metadata items.
 *
 * @platform iOS, tvOS
 */
export interface IosId3MetadataItemEntry extends BaseIosMetadataItem {
  metadataType: MetadataType.ID3;
  /**
   * Additional attributes attached to the metadata item.
   */
  extraAttributes?: Record<string, unknown>;
}

/**
 * iOS representation of DATERANGE attributes.
 *
 * @platform iOS, tvOS
 */
export interface IosDateRangeMetadataItemEntry extends BaseIosMetadataItem {
  platform: 'ios';
  metadataType: MetadataType.DATERANGE;
}

// export interface AvOtherMetadataItemEntry extends BaseAvMetadataItem {
//   metadataType: Exclude<MetadataType, MetadataType.ID3 | MetadataType.DATERANGE>;
//   /**
//    * Additional attributes attached to the metadata item.
//    */
//   extraAttributes?: Record<string, unknown>;
// }

// export type AvMetadataItemEntry =
//   | AvId3MetadataItemEntry
//   | AvDateRangeMetadataItemEntry;
  // | AvOtherMetadataItemEntry;

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
 * Encapsulates raw binary data.
 *
 * @platform Android
 */
interface AndroidBinaryFrame extends AndroidId3FrameBase {
  frameType: 'binary';
  /** Base64-encoded binary data. */
  data: Base64String;
}

/**
 * Encapsulates an attached picture.
 *
 * @platform Android
 */
interface AndroidApicFrame extends AndroidId3FrameBase {
  frameType: 'apic';
  mimeType: string;
  description?: string;
  pictureType: number;
  /** Base64-encoded image data. */
  pictureData: Base64String;
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
  text: string;
}

/**
 * Encapsulates application-specific proprietary data owned by a registered owner.
 *
 * @platform Android
 */
interface AndroidPrivFrame extends AndroidId3FrameBase {
  frameType: 'priv';
  owner: string;
  /** Base64-encoded private data. */
  privateData: Base64String;
}

/**
 * Encapsulates arbitrary binary objects with metadata.
 *
 * @platform Android
 */
interface AndroidGeobFrame extends AndroidId3FrameBase {
  frameType: 'geob';
  mimeType: string;
  filename: string;
  description: string;
  /** Base64-encoded object data. */
  data: Base64String;
}

/**
 * Defines a content chapter.
 *
 * @platform Android
 */
interface AndroidChapterFrame extends AndroidId3FrameBase {
  frameType: 'chapter';
  chapterId: string;
  timeRange: TimeRange<Milliseconds>
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
interface AndroidChapterTocFrame extends AndroidId3FrameBase {
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
 *     // TypeScript narrows to AvMetadataItemEntry (iOS) // TODO: update type-name and field used below
 *     console.log(entry.key);  // Type-safe
 *   }
 * }
 * ```
 */
export type Id3MetadataEntry = IosId3MetadataItemEntry | AndroidId3Frame;// TODO: if AVMetadataItem becomes generic, does this need changes as well?? - maybe could use A base avItemMetadata to inherit (e.g. extraAttributes is only ID3, then use ID3 child here)

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
 * Union type representing all supported timed metadata entry kinds.
 */
export type MetadataEntry = DateRangeMetadataEntry | Id3MetadataEntry | ScteMetadataEntry;
// | NoneMetadataEntry
// export interface NoneMetadataEntry { metadataType: MetadataType.NONE; }

 /**
  * A collection of timed metadata entries of the same type.
  *
  * All entries in the collection share the same `metadataType`.
  * This is the shape of the `metadata` field in `MetadataEvent`.
  *
  * @example// TODO: expand and concerete use-case
  * ```ts
  * onMetadata={(event) => {
  *   const { metadata } = event;
  *   if (metadata.metadataType === MetadataType.ID3) {
  *     // All entries are guaranteed to be ID3
  *     metadata.entries.forEach(entry => {
  *       // entry is Id3MetadataEntry
  *     });
  *   }
  * }}
  * ```
  */
export interface Metadata<T extends MetadataEntry = MetadataEntry> {// TODO: necessary?? Could provide MetadataEntry[] directly - could rename to MetadataGroup or MetadataCollection for better semantics
  // TODO: claude: consider this omogeneous across all entries. Then I think I can get rid of `metadataType` on each entry, right (and maybe BaseMetadataEntry is also useless)? But I still want a reference to `MetadataType` here at least - is that possible? Or in general, what would be the best way to achieve this?
  /**
   * Discriminator indicating the type of all entries in the metadata collection.
   */
  metadataType: T['metadataType'];// TODO: double check it is omogeneous across all entries ! (but think so, what would be the p0oint of the event habving .type then??)
  /**
   * The playback time when this metadata should trigger, relative to the playback session.
   */
  startTime: Seconds; // TODO: remove? It is available everywhere apart from iOS's dateRange - claude: what's the best way to approach this??
  /**
   * The metadata entries.
   */
  entries: T[];
}

/**
 * Narrow to ID3 metadata entries.
 */
export function isId3MetadataEntry(entry: MetadataEntry): entry is Id3MetadataEntry {
  return entry.metadataType === MetadataType.ID3;
}

/**
 * Narrow to DATERANGE metadata entries.
 */
export function isDateRangeMetadataEntry(entry: MetadataEntry): entry is DateRangeMetadataEntry {
  return entry.metadataType === MetadataType.DATERANGE;
}

/**
 * Narrow to SCTE metadata entries.
 */
export function isScteMetadataEntry(entry: MetadataEntry): entry is ScteMetadataEntry {
  return entry.metadataType === MetadataType.SCTE;
}

/**
 * Narrow to iOS ID3 entries.
 */
export function isIosId3Entry(entry: Id3MetadataEntry): entry is IosId3MetadataItemEntry {
  return (entry as IosId3MetadataItemEntry).platform === 'ios';
}

/**
 * Narrow to Android ID3 frames.
 */
export function isAndroidId3Entry(entry: Id3MetadataEntry): entry is AndroidId3Frame {
  return (entry as AndroidId3Frame).platform === 'android';
}

/**
 * Narrow to a specific Android ID3 frame type.
 */
export function isAndroidId3Frame<T extends AndroidId3Frame['frameType']>(
  entry: Id3MetadataEntry,
  frameType: T,
): entry is Extract<AndroidId3Frame, { frameType: T }> {
  return isAndroidId3Entry(entry) && entry.frameType === frameType;
}
