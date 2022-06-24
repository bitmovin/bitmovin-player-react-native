export enum SourceType {
  NONE = 'none',
  HLS = 'hls',
  DASH = 'dash',
  PROGRESSIVE = 'progressive',
  MOVPKG = 'movpkg',
}

export enum LoadingState {
  UNLOADED = 0,
  LOADING = 1,
  LOADED = 2,
}

export interface SourceConfig {
  url: string;
  type?: SourceType;
  poster?: string;
}

export interface Source {
  duration: number;
  isActive: boolean;
  isAttachedToPlayer: boolean;
  metadata?: Record<string, any>;
  loadingState?: LoadingState;
}
