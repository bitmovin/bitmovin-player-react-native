import { Platform } from 'react-native';
import { Source, TimelineReferencePoint } from './source';
import type { NativePlayer } from './modules/playerModule';
import type { NativeSource } from './modules/sourceModule';

/** Where playback starts when replaying a finished playlist. */
export enum ReplayMode {
  PLAYLIST = 'playlist',
  LAST_SOURCE = 'lastSource',
}

/** Additional native playlist configuration. */
export interface PlaylistOptions {
  /**
   * Start preloading every source when the playlist is loaded.
   * @defaultValue `false`
   */
  preloadAllSources?: boolean;
  /**
   * Where playback starts when replaying the finished playlist.
   * @defaultValue {@link ReplayMode.PLAYLIST}
   */
  replayMode?: ReplayMode;
}

/** Sources and options to load into a player. */
export interface PlaylistConfig {
  sources: Source[];
  options?: PlaylistOptions;
}

/** A position in a playlist source. @platform Android */
export interface SeekTarget {
  offset: number;
  startOffsetTimelineReference?: TimelineReferencePoint;
}

/**
 * Manages the native player's playlist. The SDK owns source order, preloading,
 * transitions and source attachment. Mutations retain the SDK's no-op and warning behavior.
 */
export class PlaylistApi {
  /** @internal */
  constructor(
    private readonly native: Promise<NativePlayer>,
    private readonly retainSource: (
      player: NativePlayer,
      source: NativeSource
    ) => void
  ) {}

  /**
   * Queries the sources currently in the native playlist.
   * Each query returns fresh JS handles to the SDK sources.
   */
  getSources = async (): Promise<Source[]> => {
    return (await (await this.native).getPlaylistSources()).map(
      Source.fromNative
    );
  };

  /** Adds a source at the given index, or appends it when omitted. */
  add = async (source: Source, index?: number): Promise<void> => {
    const nativeSource = await source.native;
    const native = await this.native;
    await native.playlistAdd(nativeSource, index);
    this.retainSource(native, nativeSource);
  };

  /** Removes a source. The active source cannot be removed. */
  remove = async (source: Source): Promise<void> => {
    const nativeSource = await source.native;
    await (await this.native).playlistRemove(nativeSource);
  };

  /** Removes the source at the given index. The active source cannot be removed. */
  removeAt = async (index: number): Promise<void> => {
    await (await this.native).playlistRemoveAt(index);
  };

  /** Seeks to a time in a source that is already part of the playlist. */
  seek = async (source: Source, time: number): Promise<void> => {
    const nativeSource = await source.native;
    await (await this.native).playlistSeek(nativeSource, time);
  };

  /** Seeks relative to a timeline reference point. @platform Android */
  seekTo = async (source: Source, target: SeekTarget): Promise<void> => {
    if (Platform.OS !== 'android')
      throw new Error('PlaylistApi.seekTo is only supported on Android.');
    const nativeSource = await source.native;
    await (await this.native).playlistSeekTo(nativeSource, target);
  };
}
