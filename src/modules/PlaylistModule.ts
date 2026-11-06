import type { NativeModule } from 'expo-modules-core';
import { requireNativeModule } from 'expo-modules-core';

export type PlaylistModuleEvents = Record<string, any>;

declare class PlaylistModule extends NativeModule<PlaylistModuleEvents> {
  /**
   * Get the native ids of the sources in the playback session, or an empty list if there is none.
   */
  sources(nativeId: string): Promise<string[]>;

  /**
   * Add a source to the playback session, optionally at `index`.
   */
  add(nativeId: string, sourceNativeId: string, index?: number): Promise<void>;

  /**
   * Remove a source from the playback session.
   */
  remove(nativeId: string, sourceNativeId: string): Promise<void>;

  /**
   * Remove the source at `index` from the playback session.
   */
  removeAt(nativeId: string, index: number): Promise<void>;

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

export default requireNativeModule<PlaylistModule>('PlaylistModule');
