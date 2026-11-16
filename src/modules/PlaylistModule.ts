import type { SharedPlayer } from './playerModule';
import type { SharedSource } from './sourceModule';
import type { NativeModule } from 'expo-modules-core';
import { requireNativeModule } from 'expo-modules-core';

export type PlaylistModuleEvents = Record<string, any>;

declare class PlaylistModule extends NativeModule<PlaylistModuleEvents> {
  /**
   * Get the native ids of the sources in the playback session, or an empty list if there is none.
   */
  sources(player: SharedPlayer, known: SharedSource[]): Promise<SharedSource[]>;

  /**
   * Add a source to the playback session, optionally at `index`.
   */
  add(
    player: SharedPlayer,
    source: SharedSource,
    index?: number
  ): Promise<void>;

  /**
   * Remove a source from the playback session.
   *
   * @returns whether the source was removed.
   */
  remove(player: SharedPlayer, source: SharedSource): Promise<boolean>;

  /**
   * Remove the source at `index` from the playback session.
   *
   * @returns the native id of the removed source, or `null` if none was removed.
   */
  removeAt(player: SharedPlayer, index: number): Promise<void>;

  /**
   * Seek to `time` in a source of the playback session.
   */
  seek(player: SharedPlayer, source: SharedSource, time: number): Promise<void>;
}

export default requireNativeModule<PlaylistModule>('PlaylistModule');
