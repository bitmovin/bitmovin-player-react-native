/**
 * A player configuration
 * @public
 */
export interface PlayerConfig {
  licenseKey: string;
}

/**
 * A source type.
 * @public
 */
export enum SourceType {
  NONE = 0,
  HLS = 1,
  DASH = 2,
  PROGRESSIVE = 3,
  MOVPKG = 4,
}

/**
 * A source configuration.
 * @public
 */
export interface SourceConfig {
  url: string;
  type?: SourceType;
  poster?: string;
}
