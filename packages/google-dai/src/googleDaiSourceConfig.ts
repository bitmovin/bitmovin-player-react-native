export enum GoogleDaiSourceType {
  DASH = 'dash',
  HLS = 'hls',
}

export type GoogleDaiSourceConfig = GoogleDaiLiveSourceConfig;

export interface GoogleDaiLiveSourceConfig {
  kind: 'live';
  assetKey: string;
  type: GoogleDaiSourceType;
  apiKey?: string;
  networkCode?: string;
  adTagParameters?: Record<string, string>;
}
