import type { PlayerEvents } from '../events';
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { NativeCallback } from '../native/nativeCallbacks';
import type { OfflineContentManager, OfflineSourceOptions } from '../offline';
import type { NativeSource } from './sourceModule';
import type { Source } from '../source';
import type { AudioTrack } from '../audioTrack';
import type { SubtitleTrack } from '../subtitleTrack';
import type { VideoQuality } from '../media';
import type { Thumbnail } from '../thumbnail';
import type { AdItem } from '../advertising';
import type { CustomDataConfig } from '../analytics/config';
import type { BufferLevels, BufferType } from '../bufferApi';
import type { PlaylistConfig, SeekTarget } from '../playlist';

export type PlayerModuleEvents = PlayerEvents;

/** @internal */
export interface NativePlayer extends SharedObject<PlayerModuleEvents> {
  /** @internal */
  initialize(): Promise<void>;
  play(): Promise<void>;

  pause(): Promise<void>;

  mute(): Promise<void>;

  unmute(): Promise<void>;

  seek(time: number): Promise<void>;

  timeShift(offset: number): Promise<void>;

  destroy(): Promise<void>;

  setVolume(volume: number): Promise<void>;

  getVolume(): Promise<number>;

  getCurrentTime(mode?: 'relative' | 'absolute'): Promise<number>;

  isPlaying(): Promise<boolean>;

  isPaused(): Promise<boolean>;

  getDuration(): Promise<number>;

  isMuted(): Promise<boolean>;

  unload(): Promise<void>;

  getTimeShift(): Promise<number>;

  isLive(): Promise<boolean>;

  getMaxTimeShift(): Promise<number>;

  getPlaybackSpeed(): Promise<number>;

  setPlaybackSpeed(playbackSpeed: number): Promise<void>;

  isAd(): Promise<boolean>;

  setMaxSelectableBitrate(maxBitrate: number | null): Promise<void>;

  isAirPlayActive(): Promise<boolean>;

  isAirPlayAvailable(): Promise<boolean>;

  showAirPlayTargetPicker(): Promise<void>;

  isCastAvailable(): Promise<boolean>;

  isCasting(): Promise<boolean>;

  castVideo(): Promise<void>;

  castStop(): Promise<void>;

  skipAd(): Promise<void>;

  canPlayAtPlaybackSpeed(playbackSpeed: number): Promise<boolean | undefined>;

  loadSource(source: Source): Promise<void>;

  loadPlaylist(config: PlaylistConfig): Promise<void>;
  getSource(
    knownSources: NativeSource[]
  ): Promise<NativeSource | null | undefined>;
  loadOfflineContent(
    offlineContent: OfflineContentManager,
    options?: OfflineSourceOptions
  ): Promise<boolean | void>;

  getAudioTrack(): Promise<AudioTrack | null>;

  getAvailableAudioTracks(): Promise<AudioTrack[]>;

  setAudioTrack(trackId: string): Promise<void>;

  getSubtitleTrack(): Promise<SubtitleTrack | null>;

  getAvailableSubtitles(): Promise<SubtitleTrack[]>;

  setSubtitleTrack(trackId: string | undefined): Promise<void>;

  scheduleAd(adConfig: AdItem): Promise<void>;

  getThumbnail(time: number): Promise<Thumbnail | null>;

  getVideoQuality(): Promise<VideoQuality>;

  getAvailableVideoQualities(): Promise<VideoQuality[]>;

  setVideoQuality(qualityId: string): Promise<void>;
}

/** @internal */
export interface NativeBuffer extends SharedObject {
  getLevel(type: BufferType): Promise<BufferLevels>;
  setTargetLevel(type: BufferType, value: number): Promise<void>;
}
/** @internal */
export interface NativeAnalytics extends SharedObject {
  sendCustomDataEvent(data: CustomDataConfig): Promise<void>;
  getUserId(): Promise<string | null>;
}
/** @internal */
export interface NativeMediaControls extends SharedObject {
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
}
/** @internal */
export interface NativePlaylist extends SharedObject {
  getSources(known: NativeSource[]): Promise<NativeSource[]>;
  add(source: Source, index?: number): Promise<void>;
  remove(source: Source): Promise<void>;
  removeAt(index: number): Promise<void>;
  seek(source: Source, time: number): Promise<void>;
  seekTo(source: Source, target: SeekTarget): Promise<void>;
}

declare class PlayerModule extends NativeModule {
  readonly isGoogleImaEnabled: boolean;
  readonly Player: new (
    config: Record<string, any>,
    analytics: Record<string, any> | undefined,
    callback: NativeCallback
  ) => NativePlayer;
  readonly BufferApi: new (player: NativePlayer) => NativeBuffer;
  readonly AnalyticsApi: new (player: NativePlayer) => NativeAnalytics;
  readonly MediaControlsApi: new (player: NativePlayer) => NativeMediaControls;
  readonly PlaylistApi: new (player: NativePlayer) => NativePlaylist;
}
const module = requireNativeModule<PlayerModule>('PlayerModule');
/** @internal */
export const NativePlayer = module.Player;
/** @internal */
export const NativeBuffer = module.BufferApi;
/** @internal */
export const NativeAnalytics = module.AnalyticsApi;
/** @internal */
export const NativeMediaControls: new (
  player: NativePlayer
) => Pick<NativeMediaControls, 'isEnabled' | 'setEnabled'> =
  Platform.OS === 'ios'
    ? module.MediaControlsApi
    : class {
        constructor(_player: NativePlayer) {}
        isEnabled(): Promise<boolean> {
          return Promise.resolve(false);
        }
        setEnabled(_enabled: boolean): Promise<void> {
          return Promise.resolve();
        }
      };
/** @internal */
export const NativePlaylist = module.PlaylistApi;
export default module;
