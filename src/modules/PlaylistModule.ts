import type { NativeModule } from 'expo-modules-core';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type PlaylistModuleEvents = Record<string, any>;

declare class PlaylistModule extends NativeModule<PlaylistModuleEvents> {
  /**
   * Get the native ids of the sources in the playback session.
   */
  sources(nativeId: string): Promise<string[] | null>;

  /**
   * Add a source to the playback session, optionally at `index`.
   *
   * @returns whether the source was added.
   */
  add(
    nativeId: string,
    sourceNativeId: string,
    index?: number
  ): Promise<boolean>;

  /**
   * Remove a source from the playback session.
   *
   * @returns the native id of the removed source, or `null` if nothing was removed.
   */
  remove(nativeId: string, sourceNativeId: string): Promise<string | null>;

  /**
   * Remove the source at `index` from the playback session.
   *
   * @returns the native id of the removed source, or `null` if nothing was removed.
   */
  removeAt(nativeId: string, index: number): Promise<string | null>;

  /**
   * Seek to `time` in a source of the playback session.
   */
  seek(nativeId: string, sourceNativeId: string, time: number): Promise<void>;

  /**
   * Seek to `seekTarget` in a source of the playback session.
   */
  seekTo(
    nativeId: string,
    sourceNativeId: string,
    seekTarget?: Record<string, any>
  ): Promise<void>;
}

// Android-only until the iOS playlist bridge is implemented
export default Platform.OS === 'android'
  ? requireNativeModule<PlaylistModule>('PlaylistModule')
  : null;
