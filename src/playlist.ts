import { bindNativeMethods } from './native/bindNativeMethods';
import { Platform } from 'react-native';
import { Source, TimelineReferencePoint } from './source';
import type { Player } from './player';
import { NativePlaylist } from './modules/playerModule';
import { retainPlayerApi, playerForApi } from './native/playerApiOwner';

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
export class PlaylistApi extends NativePlaylist {
  /** @internal */
  constructor(player: Player) {
    super(player);
    retainPlayerApi(this, player);
    bindNativeMethods(this, NativePlaylist.prototype);
  }

  /**
   * Queries the sources currently in the native playlist.
   * Reuses the original Source objects while they remain reachable.
   */
  getSources = async (): Promise<Source[]> => {
    const owner = playerForApi(this);
    const sources = (await super.getSources(owner.knownSources)).map(
      Source.fromNative
    );
    sources.forEach(owner.retainSource);
    return sources;
  };

  /** Adds a source at the given index, or appends it when omitted. */
  add = async (source: Source, index?: number): Promise<void> => {
    await super.add(source, index);
    playerForApi(this).retainSource(source);
  };

  /** Removes a source. The active source cannot be removed. */
  declare remove: (source: Source) => Promise<void>;

  /** Removes the source at the given index. The active source cannot be removed. */
  declare removeAt: (index: number) => Promise<void>;

  /** Seeks to a time in a source that is already part of the playlist. */
  declare seek: (source: Source, time: number) => Promise<void>;

  /** Seeks relative to a timeline reference point. @platform Android */
  seekTo = async (source: Source, target: SeekTarget): Promise<void> => {
    if (Platform.OS !== 'android')
      throw new Error('PlaylistApi.seekTo is only supported on Android.');
    await super.seekTo(source, target);
  };
}
