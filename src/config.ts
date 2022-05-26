export interface PlayerConfig {
  licenseKey: string;
}

export type SourceType = 'none' | 'hls' | 'dash' | 'progressive' | 'movpkg';

export interface SourceConfig {
  url: string;
  type?: SourceType;
  poster?: string;
}
