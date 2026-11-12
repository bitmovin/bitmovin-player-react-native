import { Platform } from 'react-native';
import { Source, TimelineReferencePoint, getNativeSource } from './source';
import { type Player, getNativePlayer } from './player';
import { NativePlaylist } from './modules/playerModule';

/**
 * Where playback starts when replaying a finished playlist.
 * @experimental
 */
export enum ReplayMode {
  PLAYLIST = 'playlist',
  LAST_SOURCE = 'lastSource',
}

/**
 * Additional native playlist configuration.
 * @experimental
 */
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

/**
 * Sources and options to load into a player.
 * @experimental
 */
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
 * @experimental
 */
export class PlaylistApi {
  private readonly native: InternalPlaylist;
  /** @internal */
  constructor(private readonly owner: Player) {
    this.native = new InternalPlaylist(this, owner);
  }

  /**
   * Queries the sources currently in the native playlist.
   * Reuses the original Source objects while they remain reachable.
   */
  getSources = async (): Promise<Source[]> => {
    const owner = this.owner;
    const sources = (
      await this.native.getSources(owner.knownSources.map(getNativeSource))
    ).map(Source.fromNative);
    sources.forEach(owner.retainSource);
    return sources;
  };

  /** Adds a source at the given index, or appends it when omitted. */
  add = async (source: Source, index?: number): Promise<void> => {
    await this.native.add(getNativeSource(source), index);
    this.owner.retainSource(source);
  };

  /** Removes a source. The active source cannot be removed. */
  remove = (source: Source): Promise<void> =>
    this.native.remove(getNativeSource(source));

  /** Removes the source at the given index. The active source cannot be removed. */
  removeAt = (index: number): Promise<void> => this.native.removeAt(index);

  /** Seeks to a time in a source that is already part of the playlist. */
  seek = (source: Source, time: number): Promise<void> =>
    this.native.seek(getNativeSource(source), time);

  /** Seeks relative to a timeline reference point. @platform Android */
  seekTo = async (source: Source, target: SeekTarget): Promise<void> => {
    if (Platform.OS !== 'android')
      throw new Error('PlaylistApi.seekTo is only supported on Android.');
    await this.native.seekTo(getNativeSource(source), target);
  };
}

/** @internal */
class InternalPlaylist extends NativePlaylist {
  constructor(
    readonly playlist: PlaylistApi,
    readonly player: Player
  ) {
    super(getNativePlayer(player));
  }
}
