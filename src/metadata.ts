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
export type MetadataEntry = ScteMetadataEntry;

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
