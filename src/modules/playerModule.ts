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
import type { SharedOfflineContentManager } from '../offline/offlineModule';
import type { OfflineSourceOptions } from '../offline';
import type { BufferApi } from '../bufferApi';
import type { AnalyticsApi } from '../analytics/analyticsApi';
import type { MediaControlsApi } from '../mediaControlsApi';
import type { PlaylistApi, PlaylistOptions, SeekTarget } from '../playlist';

export type PlayerModuleEvents = EventCallbacks<PlayerEventMap>;
/** @internal */
export type SharedPlayer = SharedObject<EventCallbacks<PlayerEventMap>> &
  Omit<
    NativeMethods<Player>,
    | 'on'
    | 'off'
    | 'load'
    | 'retainSource'
    | 'loadSource'
    | 'loadPlaylist'
    | 'getSource'
    | 'loadOfflineContent'
    | 'setMaxSelectableBitrate'
  > & {
    loadSource(source: SharedSource): Promise<void>;
    loadPlaylist(
      sources: SharedSource[],
      options?: PlaylistOptions
    ): Promise<void>;
    getSource(known: SharedSource[]): Promise<SharedSource | null | undefined>;
    loadOfflineContent(
      manager: SharedOfflineContentManager,
      options?: OfflineSourceOptions
    ): Promise<boolean>;
    setMaxSelectableBitrate(value: number): Promise<void>;
  };
/** @internal */
export type SharedBufferApi = SharedObject & NativeMethods<BufferApi>;
/** @internal */
export type SharedAnalyticsApi = SharedObject & NativeMethods<AnalyticsApi>;
/** @internal */
export type SharedMediaControlsApi = SharedObject &
  NativeMethods<MediaControlsApi>;
/** @internal */
export type SharedPlaylistApi = SharedObject &
  Pick<PlaylistApi, 'removeAt'> & {
    getSources(known: SharedSource[]): Promise<SharedSource[]>;
    add(source: SharedSource, index?: number): Promise<void>;
    remove(source: SharedSource): Promise<void>;
    seek(source: SharedSource, time: number): Promise<void>;
    seekTo(source: SharedSource, target: SeekTarget): Promise<void>;
  };

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
  readonly SharedPlaylistApi: new (player: SharedPlayer) => SharedPlaylistApi;
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
/** @internal */
export const SharedPlaylistApi = nativeModule.SharedPlaylistApi;
export default nativeModule;
