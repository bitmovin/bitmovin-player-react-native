import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../nativeCallbacks';
import type { NativeOffline } from '../offline/offlineModule';
import type { NativeSource } from './SourceModule';
import type { BufferLevels } from '../bufferApi';
import { nativeOwner } from '../nativeOwner';

export type PlayerModuleEvents = Record<string, never>;

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

  canPlayAtPlaybackSpeed(playbackSpeed: number): Promise<boolean | null>;

  loadSource(source: NativeSource): Promise<void>;

  loadOfflineContent(
    offlineContent: NativeOffline | undefined,
    options?: Record<string, any>
  ): Promise<boolean>;

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
  create(
    config?: Record<string, any>,
    analyticsConfig?: Record<string, any>,
    callback?: NativeCallback
  ): Promise<NativePlayer>;
}

export default requireNativeModule<PlayerModule>('PlayerModule');

/** @internal */
export async function retainLoadedSource(
  player: NativePlayer,
  source: NativeSource | NativeOffline | undefined,
  operation: Promise<void | boolean>
): Promise<void> {
  if ((await operation) !== false) nativeOwner.set(player, source);
}
