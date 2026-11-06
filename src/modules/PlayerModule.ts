import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { AdBreak, AdItem, ImaSettings } from '../advertising';
import type { NativeSource } from './SourceModule';
import type { BufferLevels } from '../bufferApi';

export type PlayerModuleEvents = {
  onShouldLoadAdItem: ({ id, adItem }: { id: number; adItem: AdItem }) => void;
  onShouldPlayAdBreak: ({
    id,
    adBreak,
  }: {
    id: number;
    adBreak: AdBreak;
  }) => void;
  onImaBeforeInitialization: ({
    id,
    settings,
  }: {
    id: number;
    settings: ImaSettings;
  }) => void;
};

/** @internal */
export interface NativePlayer extends SharedObject<PlayerModuleEvents> {
  getBufferLevel(type: string): Promise<BufferLevels | null>;

  setBufferTargetLevel(type: string, value: number): Promise<void>;

  sendCustomDataEvent(customData: Record<string, any>): Promise<void>;

  getAnalyticsUserId(): Promise<string | null>;

  isMediaControlsEnabled(): Promise<boolean | null>;

  setMediaControlsEnabled(enabled: boolean): Promise<void>;

  play(): Promise<void>;

  pause(): Promise<void>;

  mute(): Promise<void>;

  unmute(): Promise<void>;

  seek(time: number): Promise<void>;

  timeShift(offset: number): Promise<void>;

  destroy(): Promise<void>;

  setVolume(volume: number): Promise<void>;

  getVolume(): Promise<number | null>;

  currentTime(mode?: string): Promise<number | null>;

  isPlaying(): Promise<boolean | null>;

  isPaused(): Promise<boolean | null>;

  duration(): Promise<number | null>;

  isMuted(): Promise<boolean | null>;

  unload(): Promise<void>;

  getTimeShift(): Promise<number | null>;

  isLive(): Promise<boolean | null>;

  getMaxTimeShift(): Promise<number | null>;

  getPlaybackSpeed(): Promise<number | null>;

  setPlaybackSpeed(playbackSpeed: number): Promise<void>;

  isAd(): Promise<boolean | null>;

  setMaxSelectableBitrate(maxBitrate: number): Promise<void>;

  isAirPlayActive(): Promise<boolean | null>;

  isAirPlayAvailable(): Promise<boolean | null>;

  showAirPlayTargetPicker(): Promise<void>;

  isCastAvailable(): Promise<boolean | null>;

  isCasting(): Promise<boolean | null>;

  castVideo(): Promise<void>;

  castStop(): Promise<void>;

  skipAd(): Promise<void>;

  setShouldLoadAdItem(id: number, shouldLoad: boolean): Promise<void>;

  setShouldPlayAdBreak(id: number, shouldPlay: boolean): Promise<void>;

  setPreparedImaSettings(id: number, settings: ImaSettings): Promise<void>;

  canPlayAtPlaybackSpeed(playbackSpeed: number): Promise<boolean | null>;

  initializeWithConfig(
    config?: Record<string, any>,
    networkNativeId?: string,
    decoderNativeId?: string
  ): Promise<void>;

  initializeWithAnalyticsConfig(
    analyticsConfig: Record<string, any>,
    config?: Record<string, any>,
    networkNativeId?: string,
    decoderNativeId?: string
  ): Promise<void>;

  loadSource(source: NativeSource): Promise<void>;

  loadOfflineContent(
    offlineContentId: string,
    options?: Record<string, any>
  ): Promise<void>;

  getAudioTrack(): Promise<any | null>;

  getAvailableAudioTracks(): Promise<any[]>;

  setAudioTrack(trackId: string): Promise<void>;

  getSubtitleTrack(): Promise<any | null>;

  getAvailableSubtitles(): Promise<any[]>;

  setSubtitleTrack(trackId: string | null): Promise<void>;

  scheduleAd(adConfig: Record<string, any>): Promise<void>;

  getThumbnail(time: number): Promise<any | null>;

  getVideoQuality(): Promise<any | null>;

  getAvailableVideoQualities(): Promise<any[]>;

  setVideoQuality(qualityId: string): Promise<void>;
}

declare class PlayerModule extends NativeModule {
  readonly isGoogleImaEnabled: boolean;
  create(nativeId: string): NativePlayer;
}

export default requireNativeModule<PlayerModule>('PlayerModule');
