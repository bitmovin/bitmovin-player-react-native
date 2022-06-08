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
  NONE = 'none',
  HLS = 'hls',
  DASH = 'dash',
  PROGRESSIVE = 'progressive',
  MOVPKG = 'movpkg',
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
