/* eslint-disable @typescript-eslint/no-redeclare -- Native constructor values share their instance type names. */
import type { NativeModule } from 'expo-modules-core';
import type { SharedObject } from 'expo-modules-core/types';
import { requireNativeModule } from 'expo-modules-core';
import type { NativeCallback } from '../native/nativeCallbacks';
import type { NativeMethods } from '../native/nativeMethods';
import type { Player } from '../player';
import type { PlayerEvents } from '../events';
import type { NativeSource } from './sourceModule';
import type { NativeOffline } from '../offline/offlineModule';
import type { OfflineSourceOptions } from '../offline';
import type { BufferApi } from '../bufferApi';
import type { AnalyticsApi } from '../analytics/analyticsApi';
import type { MediaControlsApi } from '../mediaControlsApi';
import type { PlaylistApi, PlaylistOptions, SeekTarget } from '../playlist';

export type PlayerModuleEvents = PlayerEvents;
/** @internal */
export type NativePlayer = SharedObject<PlayerEvents> &
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
    loadSource(source: NativeSource): Promise<void>;
    loadPlaylist(
      sources: NativeSource[],
      options?: PlaylistOptions
    ): Promise<void>;
    getSource(known: NativeSource[]): Promise<NativeSource | null | undefined>;
    loadOfflineContent(
      manager: NativeOffline,
      options?: OfflineSourceOptions
    ): Promise<boolean>;
    setMaxSelectableBitrate(value: number): Promise<void>;
  };
/** @internal */
export type NativeBuffer = SharedObject & NativeMethods<BufferApi>;
/** @internal */
export type NativeAnalytics = SharedObject & NativeMethods<AnalyticsApi>;
/** @internal */
export type NativeMediaControls = SharedObject &
  NativeMethods<MediaControlsApi>;
/** @internal */
export type NativePlaylist = SharedObject &
  Pick<PlaylistApi, 'removeAt'> & {
    getSources(known: NativeSource[]): Promise<NativeSource[]>;
    add(source: NativeSource, index?: number): Promise<void>;
    remove(source: NativeSource): Promise<void>;
    seek(source: NativeSource, time: number): Promise<void>;
    seekTo(source: NativeSource, target: SeekTarget): Promise<void>;
  };

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
const nativeModule = requireNativeModule<PlayerModule>('PlayerModule');
/** @internal */
export const NativePlayer = nativeModule.Player;
/** @internal */
export const NativeBuffer = nativeModule.BufferApi;
/** @internal */
export const NativeAnalytics = nativeModule.AnalyticsApi;
/** @internal */
export const NativeMediaControls = nativeModule.MediaControlsApi;
/** @internal */
export const NativePlaylist = nativeModule.PlaylistApi;
export default nativeModule;
