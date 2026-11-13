/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values share their instance type names. */
// Register the Source class before native queries can return an SDK-created peer.
import './sourceModule';
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeMethods } from '../native/nativeMethods';
import type { Player } from '../player';
import type { PlayerConfig } from '../playerConfig';
import type { PlayerEventMap, EventCallbacks } from '../native/eventMap';
import type { SharedSource } from './sourceModule';
import type { PlaylistOptions } from '../playlist';
import type { OfflineSourceOptions } from '../offline';
import type { BufferApi } from '../bufferApi';
import type { AnalyticsApi } from '../analytics/analyticsApi';
import type { MediaControlsApi } from '../mediaControlsApi';

/** @internal */
export type SharedPlayer = SharedObject<EventCallbacks<PlayerEventMap>> &
  Pick<NativeMethods<Player>, 'destroy'> & {
    loadSource(source: SharedSource): Promise<void>;
    loadPlaylist(
      sources: SharedSource[],
      options?: PlaylistOptions
    ): Promise<void>;
    getSource(known: SharedSource[]): Promise<SharedSource | null | undefined>;
  };

/** @internal */
export type SharedBufferApi = SharedObject & NativeMethods<BufferApi>;
/** @internal */
export type SharedAnalyticsApi = SharedObject & NativeMethods<AnalyticsApi>;
/** @internal */
export type SharedMediaControlsApi = SharedObject &
  NativeMethods<MediaControlsApi>;

declare class PlayerModule extends NativeModule {
  readonly isGoogleImaEnabled: boolean;
  readonly SharedPlayer: new (
    config: PlayerConfig,
    analytics: PlayerConfig['analyticsConfig']
  ) => SharedPlayer;
  readonly SharedBufferApi: new (player: SharedPlayer) => SharedBufferApi;
  readonly SharedAnalyticsApi: new (player: SharedPlayer) => SharedAnalyticsApi;
  readonly SharedMediaControlsApi: new (
    player: SharedPlayer
  ) => SharedMediaControlsApi;
  canPlayAtPlaybackSpeed(
    player: SharedPlayer,
    ...args: Parameters<Player['canPlayAtPlaybackSpeed']>
  ): ReturnType<Player['canPlayAtPlaybackSpeed']>;
  castStop(
    player: SharedPlayer,
    ...args: Parameters<Player['castStop']>
  ): ReturnType<Player['castStop']>;
  castVideo(
    player: SharedPlayer,
    ...args: Parameters<Player['castVideo']>
  ): ReturnType<Player['castVideo']>;
  getAudioTrack(
    player: SharedPlayer,
    ...args: Parameters<Player['getAudioTrack']>
  ): ReturnType<Player['getAudioTrack']>;
  getAvailableAudioTracks(
    player: SharedPlayer,
    ...args: Parameters<Player['getAvailableAudioTracks']>
  ): ReturnType<Player['getAvailableAudioTracks']>;
  getAvailableSubtitles(
    player: SharedPlayer,
    ...args: Parameters<Player['getAvailableSubtitles']>
  ): ReturnType<Player['getAvailableSubtitles']>;
  getAvailableVideoQualities(
    player: SharedPlayer,
    ...args: Parameters<Player['getAvailableVideoQualities']>
  ): ReturnType<Player['getAvailableVideoQualities']>;
  getCurrentTime(
    player: SharedPlayer,
    ...args: Parameters<Player['getCurrentTime']>
  ): ReturnType<Player['getCurrentTime']>;
  getDuration(
    player: SharedPlayer,
    ...args: Parameters<Player['getDuration']>
  ): ReturnType<Player['getDuration']>;
  getMaxTimeShift(
    player: SharedPlayer,
    ...args: Parameters<Player['getMaxTimeShift']>
  ): ReturnType<Player['getMaxTimeShift']>;
  getPlaybackSpeed(
    player: SharedPlayer,
    ...args: Parameters<Player['getPlaybackSpeed']>
  ): ReturnType<Player['getPlaybackSpeed']>;
  getSubtitleTrack(
    player: SharedPlayer,
    ...args: Parameters<Player['getSubtitleTrack']>
  ): ReturnType<Player['getSubtitleTrack']>;
  getThumbnail(
    player: SharedPlayer,
    ...args: Parameters<Player['getThumbnail']>
  ): ReturnType<Player['getThumbnail']>;
  getTimeShift(
    player: SharedPlayer,
    ...args: Parameters<Player['getTimeShift']>
  ): ReturnType<Player['getTimeShift']>;
  getVideoQuality(
    player: SharedPlayer,
    ...args: Parameters<Player['getVideoQuality']>
  ): ReturnType<Player['getVideoQuality']>;
  getVolume(
    player: SharedPlayer,
    ...args: Parameters<Player['getVolume']>
  ): ReturnType<Player['getVolume']>;
  isAd(
    player: SharedPlayer,
    ...args: Parameters<Player['isAd']>
  ): ReturnType<Player['isAd']>;
  isAirPlayActive(
    player: SharedPlayer,
    ...args: Parameters<Player['isAirPlayActive']>
  ): ReturnType<Player['isAirPlayActive']>;
  isAirPlayAvailable(
    player: SharedPlayer,
    ...args: Parameters<Player['isAirPlayAvailable']>
  ): ReturnType<Player['isAirPlayAvailable']>;
  isCastAvailable(
    player: SharedPlayer,
    ...args: Parameters<Player['isCastAvailable']>
  ): ReturnType<Player['isCastAvailable']>;
  isCasting(
    player: SharedPlayer,
    ...args: Parameters<Player['isCasting']>
  ): ReturnType<Player['isCasting']>;
  isLive(
    player: SharedPlayer,
    ...args: Parameters<Player['isLive']>
  ): ReturnType<Player['isLive']>;
  isMuted(
    player: SharedPlayer,
    ...args: Parameters<Player['isMuted']>
  ): ReturnType<Player['isMuted']>;
  isPaused(
    player: SharedPlayer,
    ...args: Parameters<Player['isPaused']>
  ): ReturnType<Player['isPaused']>;
  isPlaying(
    player: SharedPlayer,
    ...args: Parameters<Player['isPlaying']>
  ): ReturnType<Player['isPlaying']>;
  mute(
    player: SharedPlayer,
    ...args: Parameters<Player['mute']>
  ): ReturnType<Player['mute']>;
  pause(
    player: SharedPlayer,
    ...args: Parameters<Player['pause']>
  ): ReturnType<Player['pause']>;
  play(
    player: SharedPlayer,
    ...args: Parameters<Player['play']>
  ): ReturnType<Player['play']>;
  scheduleAd(
    player: SharedPlayer,
    ...args: Parameters<Player['scheduleAd']>
  ): ReturnType<Player['scheduleAd']>;
  seek(
    player: SharedPlayer,
    ...args: Parameters<Player['seek']>
  ): ReturnType<Player['seek']>;
  setAudioTrack(
    player: SharedPlayer,
    ...args: Parameters<Player['setAudioTrack']>
  ): ReturnType<Player['setAudioTrack']>;
  setMaxSelectableBitrate(
    player: SharedPlayer,
    ...args: Parameters<Player['setMaxSelectableBitrate']>
  ): ReturnType<Player['setMaxSelectableBitrate']>;
  setPlaybackSpeed(
    player: SharedPlayer,
    ...args: Parameters<Player['setPlaybackSpeed']>
  ): ReturnType<Player['setPlaybackSpeed']>;
  setSubtitleTrack(
    player: SharedPlayer,
    ...args: Parameters<Player['setSubtitleTrack']>
  ): ReturnType<Player['setSubtitleTrack']>;
  setVideoQuality(
    player: SharedPlayer,
    ...args: Parameters<Player['setVideoQuality']>
  ): ReturnType<Player['setVideoQuality']>;
  setVolume(
    player: SharedPlayer,
    ...args: Parameters<Player['setVolume']>
  ): ReturnType<Player['setVolume']>;
  showAirPlayTargetPicker(
    player: SharedPlayer,
    ...args: Parameters<Player['showAirPlayTargetPicker']>
  ): ReturnType<Player['showAirPlayTargetPicker']>;
  skipAd(
    player: SharedPlayer,
    ...args: Parameters<Player['skipAd']>
  ): ReturnType<Player['skipAd']>;
  timeShift(
    player: SharedPlayer,
    ...args: Parameters<Player['timeShift']>
  ): ReturnType<Player['timeShift']>;
  unload(
    player: SharedPlayer,
    ...args: Parameters<Player['unload']>
  ): ReturnType<Player['unload']>;
  unmute(
    player: SharedPlayer,
    ...args: Parameters<Player['unmute']>
  ): ReturnType<Player['unmute']>;
  loadOfflineContent(
    player: SharedPlayer,
    offlineId: string,
    options?: OfflineSourceOptions
  ): Promise<boolean | void>;
}
const nativeModule = requireNativeModule<PlayerModule>('PlayerModule');
/** @internal */
export const SharedPlayer = nativeModule.SharedPlayer;
/** @internal */
export const SharedBufferApi = nativeModule.SharedBufferApi;
/** @internal */
export const SharedAnalyticsApi = nativeModule.SharedAnalyticsApi;
/** @internal */
export const SharedMediaControlsApi = nativeModule.SharedMediaControlsApi;
export default nativeModule;
