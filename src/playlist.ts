import { EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';
import PlayerModule from './modules/PlayerModule';
import { Event, EventSource } from './events';
import { Source, TimelineReferencePoint } from './source';
import { normalizeNonFinite } from './utils/normalizeNonFinite';

/** Replay behavior when playback reaches the end of a playlist. */
export enum ReplayMode {
  /** Replays the whole playlist. */
  PLAYLIST = 'playlist',
  /** Replays only the last source. */
  LAST_SOURCE = 'lastSource',
}

/** Options used when loading a playlist. */
export interface PlaylistOptions {
  /**
   * Whether all sources should preload immediately after the playlist is loaded.
   * @defaultValue `false`
   */
  preloadAllSources?: boolean;
  /**
   * Whether replay starts from the whole playlist or the last source.
   * @defaultValue `ReplayMode.PLAYLIST`
   */
  replayMode?: ReplayMode;
}

/** A playlist playback session. */
export interface PlaylistConfig {
  /** Sources in playback order. */
  sources: Source[];
  /** Native playlist options. */
  options?: PlaylistOptions;
}

/**
 * Structured playlist seek target.
 *
 * @platform Android
 */
export interface PlaylistSeekTarget {
  /** Target offset in seconds. */
  offset: number;
  /** Timeline reference for the offset. Unsupported on iOS/tvOS. */
  startOffsetTimelineReference?: TimelineReferencePoint;
}

export type PlaylistSeek = number | PlaylistSeekTarget | null | undefined;

export interface PlaylistSourceAddedEvent extends Event {
  /** Snapshot of the affected native source at event time. */
  source: EventSource;
  /** Native ID of the affected source when it is known to this React Native instance. */
  sourceNativeId?: string;
  /** Original operational {@link Source} reference, when created through this playlist API. */
  sourceReference?: Source;
  /** Native playlist index of the affected source. */
  index: number;
}

export interface PlaylistSourceRemovedEvent extends Event {
  /** Snapshot of the affected native source at event time. */
  source: EventSource;
  /** Native ID of the affected source when it is known to this React Native instance. */
  sourceNativeId?: string;
  /** Original operational {@link Source} reference, when created through this playlist API. */
  sourceReference?: Source;
  /** Native playlist index of the affected source. */
  index: number;
}

export interface PlaylistTransitionEvent extends Event {
  /** Snapshot of the previous native source at event time. */
  from: EventSource;
  /** Snapshot of the new native source at event time. */
  to: EventSource;
  /** Native ID of the previous source when it is known to this React Native instance. */
  fromSourceNativeId?: string;
  /** Native ID of the new source when it is known to this React Native instance. */
  toSourceNativeId?: string;
  /** Original previous {@link Source} reference, when created through this playlist API. */
  fromSourceReference?: Source;
  /** Original new {@link Source} reference, when created through this playlist API. */
  toSourceReference?: Source;
}

export type PlaylistEventType =
  | 'sourceAdded'
  | 'sourceRemoved'
  | 'playlistTransition';

export type PlaylistEventByType<T extends PlaylistEventType> =
  T extends 'sourceAdded'
    ? PlaylistSourceAddedEvent
    : T extends 'sourceRemoved'
      ? PlaylistSourceRemovedEvent
      : PlaylistTransitionEvent;

const eventNames: Record<PlaylistEventType, string> = {
  sourceAdded: 'onSourceAdded',
  sourceRemoved: 'onSourceRemoved',
  playlistTransition: 'onPlaylistTransition',
};

export class PlaylistApi {
  private sourceReferences = new Map<string, Source>();
  private transitionSubscription?: EventSubscription;

  constructor(
    private readonly playerNativeId: string,
    private readonly setActiveSource: (source: Source | undefined) => void,
    private readonly ensurePlayerInitialized: () => Promise<void>
  ) {}

  /** Loads a playlist and replaces the current playback session. */
  load = async (
    configOrSources: PlaylistConfig | Source[],
    options?: PlaylistOptions
  ): Promise<void> => {
    const config = Array.isArray(configOrSources)
      ? { sources: configOrSources, options }
      : configOrSources;

    await this.ensurePlayerInitialized();
    await Promise.all(
      [...new Set(config.sources)].map((source) => source.initialize())
    );
    this.registerSources(config.sources);
    this.setActiveSource(config.sources[0]);
    await PlayerModule.loadPlaylist(
      this.playerNativeId,
      config.sources.map((source) => source.nativeId),
      config.options
    );
  };

  /** Appends a source or inserts it at `index` when provided. */
  add = async (source: Source, index?: number): Promise<void> => {
    await source.initialize();
    this.registerSources([source]);
    await PlayerModule.playlistAddSource(
      this.playerNativeId,
      source.nativeId,
      index ?? null
    );
  };

  /** Removes a source from the active playlist. Removing the active source is a native no-op. */
  remove = async (source: Source): Promise<void> => {
    await PlayerModule.playlistRemoveSource(
      this.playerNativeId,
      source.nativeId
    );
  };

  /** Removes the source at `index`. Removing the active source is a native no-op. */
  removeAt = async (index: number): Promise<void> => {
    await PlayerModule.playlistRemoveSourceAt(this.playerNativeId, index);
  };

  /**
   * Seeks within a playlist source, switching active source if needed.
   * Android supports structured targets and `null`/`undefined` for the source default position.
   * iOS/tvOS supports time-based playlist seeking only.
   */
  seek = async (source: Source, target?: PlaylistSeek): Promise<void> => {
    if (Platform.OS === 'ios' && typeof target === 'object' && target != null) {
      console.warn(
        `[Player ${this.playerNativeId}] Structured playlist seek targets are not available on iOS/tvOS.`
      );
      return;
    }
    if (typeof target === 'object' && target != null) {
      await PlayerModule.playlistSeekToTarget(
        this.playerNativeId,
        source.nativeId,
        target
      );
      return;
    }
    await PlayerModule.playlistSeekToTime(
      this.playerNativeId,
      source.nativeId,
      target ?? null
    );
  };

  /** Returns the playlist sources in native playback order. */
  getSources = async (): Promise<Source[]> => {
    const nativeIds = await PlayerModule.getPlaylistSources(
      this.playerNativeId
    );
    return nativeIds
      .map((nativeId) => this.sourceReferences.get(nativeId))
      .filter((source): source is Source => source != null);
  };

  /** Adds a listener for playlist events delivered by the player module. */
  addEventListener = <T extends PlaylistEventType>(
    type: T,
    listener: (event: PlaylistEventByType<T>) => void
  ): EventSubscription => {
    this.ensureTransitionListener();
    return PlayerModule.addListener(eventNames[type] as any, (event: any) => {
      if (event.nativeId !== this.playerNativeId) {
        return;
      }
      const resolved = this.resolveEventSources(normalizeNonFinite(event));
      listener(resolved as PlaylistEventByType<T>);
    });
  };

  registerSources = (sources: Source[]) => {
    sources.forEach((source) =>
      this.sourceReferences.set(source.nativeId, source)
    );
    this.ensureTransitionListener();
  };

  /** @internal Removes the player-owned transition listener. */
  dispose = () => {
    this.transitionSubscription?.remove();
    this.transitionSubscription = undefined;
  };

  private ensureTransitionListener = () => {
    // Subscribe once, before public listeners, without constructor/render side effects.
    this.transitionSubscription ??= PlayerModule.addListener(
      'onPlaylistTransition',
      (event) => {
        if (event.nativeId !== this.playerNativeId) {
          return;
        }
        const source = event.toSourceNativeId
          ? this.sourceReferences.get(event.toSourceNativeId)
          : undefined;
        if (source) {
          this.setActiveSource(source);
        }
      }
    );
  };

  private resolveEventSources = (event: any) => {
    const sourceReference = event.sourceNativeId
      ? this.sourceReferences.get(event.sourceNativeId)
      : undefined;
    const fromSourceReference = event.fromSourceNativeId
      ? this.sourceReferences.get(event.fromSourceNativeId)
      : undefined;
    const toSourceReference = event.toSourceNativeId
      ? this.sourceReferences.get(event.toSourceNativeId)
      : undefined;

    return {
      ...event,
      sourceReference,
      fromSourceReference,
      toSourceReference,
    };
  };
}
