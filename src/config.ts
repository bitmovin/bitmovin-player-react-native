export type ConfigSourceType =
  | 'none'
  | 'hls'
  | 'dash'
  | 'progressive'
  | 'movpkg';

export interface Config {
  player: {
    licenseKey: string;
  };
  source: {
    url: string;
    type?: ConfigSourceType;
    poster?: string;
  };
}
