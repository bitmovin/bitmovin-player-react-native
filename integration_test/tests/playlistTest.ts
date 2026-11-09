import { Platform } from 'react-native';
import {
  LoadingState,
  PlaylistTransitionEvent,
  ReplayMode,
  Source,
  SourceAddedEvent,
  SourceRemovedEvent,
} from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventSequence,
  EventType,
  FilteredEvent,
  PlainEvent,
  startPlayerTest,
} from '../playertesting';
import { Sources } from './helper/Sources';
import { expect } from './helper/Expect';

const sourceAdded =
  Platform.OS === 'ios' ? EventType.SourceAddedEvent : EventType.SourceAdded;
const sourceRemoved =
  Platform.OS === 'ios'
    ? EventType.SourceRemovedEvent
    : EventType.SourceRemoved;

const makeSources = () => [
  new Source({ ...Sources.artOfMotionHls, metadata: { item: 'first' } }),
  new Source({ ...Sources.sintel, metadata: { item: 'second' } }),
];

// Adapted from the previous playlist stack's tests. Assertions use SDK state
// and the existing EventSource snapshots, without requiring native ID maps.
export default (spec: TestScope) => {
  spec.describe('native playlist', () => {
    spec.it(
      'loads sources in order and exposes the active SDK source',
      async () => {
        await startPlayerTest({}, async () => {
          const [first, second] = makeSources();
          const events = await callPlayerAndExpectEvents(
            (player) => player.loadPlaylist({ sources: [first, second] }),
            EventSequence(
              FilteredEvent<SourceAddedEvent>(
                sourceAdded,
                (event) => event.index === 0
              ),
              FilteredEvent<SourceAddedEvent>(
                sourceAdded,
                (event) => event.index === 1
              ),
              PlainEvent(EventType.Ready)
            )
          );
          expect(
            (events[0] as SourceAddedEvent).source.isAttachedToPlayer
          ).toBeTruthy();
          expect(
            (events[1] as SourceAddedEvent).source.isAttachedToPlayer
          ).toBeTruthy();
          await callPlayer(async (player) => {
            expect(await player.playlist.getSources()).toEqual([first, second]);
            expect(await player.getSource()).toBe(first);
            expect(await first.isAttachedToPlayer()).toBeTruthy();
            expect(await second.isActive()).toBeFalsy();
          });
        });
      }
    );

    spec.it(
      'seeks to another source and reports both transition endpoints',
      async () => {
        await startPlayerTest({}, async () => {
          const [first, second] = makeSources();
          await callPlayerAndExpectEvent(
            (player) => player.loadPlaylist({ sources: [first, second] }),
            EventType.Ready
          );
          const event = await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
            (player) => player.playlist.seek(second, 10),
            EventType.PlaylistTransition
          );
          expect(event.from.metadata?.item).toBe('first');
          expect(event.to.metadata?.item).toBe('second');
          await callPlayer(async (player) => {
            expect(await player.getSource()).toBe(second);
            expect(await second.isActive()).toBeTruthy();
            expect(await first.isActive()).toBeFalsy();
          });
        });
      }
    );

    spec.it('automatically transitions at the end of a source', async () => {
      await startPlayerTest({}, async () => {
        const [first, second] = makeSources();
        await callPlayerAndExpectEvent(
          (player) => player.loadPlaylist({ sources: [first, second] }),
          EventType.Ready
        );
        const duration = await first.duration();
        await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
          (player) => {
            player.seek(duration - 1);
            player.play();
          },
          FilteredEvent<PlaylistTransitionEvent>(
            EventType.PlaylistTransition,
            (event) => event.to.metadata?.item === 'second'
          ),
          30
        );
        await callPlayer(async (player) => {
          expect(await player.getSource()).toBe(second);
        });
      });
    });

    spec.it(
      'adds, removes and reuses a source without recreating it',
      async () => {
        await startPlayerTest({}, async () => {
          const [first, second] = makeSources();
          const third = new Source(Sources.artOfMotionHls);
          await callPlayerAndExpectEvent(
            (player) => player.loadPlaylist({ sources: [first, second] }),
            EventType.Ready
          );
          const added = await callPlayerAndExpectEvent<SourceAddedEvent>(
            (player) => player.playlist.add(third, 1),
            sourceAdded
          );
          expect(added.index).toBe(1);
          await callPlayer(async (player) => {
            expect(await player.playlist.getSources()).toEqual([
              first,
              third,
              second,
            ]);
          });
          const removed = await callPlayerAndExpectEvent<SourceRemovedEvent>(
            (player) => player.playlist.remove(third),
            sourceRemoved
          );
          expect(removed.index).toBe(1);
          expect(await third.isAttachedToPlayer()).toBeFalsy();
          await callPlayerAndExpectEvent(
            (player) => player.playlist.add(third),
            sourceAdded
          );
          await callPlayerAndExpectEvent(
            (player) => player.playlist.removeAt(1),
            sourceRemoved
          );
          await callPlayer(async (player) => {
            expect(await player.playlist.getSources()).toEqual([first, third]);
          });
        });
      }
    );

    spec.it('preloads inactive sources when requested', async () => {
      await startPlayerTest({}, async () => {
        const [first, second] = makeSources();
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let stopObserving = () => {};
        const loaded = new Promise<void>((resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Inactive source did not preload')),
            30000
          );
          stopObserving = second.on('sourceLoaded', () => resolve()).remove;
        });
        void loaded.catch(() => {});
        try {
          await callPlayerAndExpectEvent(
            (player) =>
              player.loadPlaylist({
                sources: [first, second],
                options: {
                  preloadAllSources: true,
                  replayMode: ReplayMode.LAST_SOURCE,
                },
              }),
            EventType.Ready
          );
          await loaded;
          expect(await second.loadingState()).toBe(LoadingState.LOADED);
          expect(await second.isActive()).toBeFalsy();
        } finally {
          clearTimeout(timeout);
          stopObserving();
        }
      });
    });

    spec.it('unloads all sources and leaves them reusable', async () => {
      await startPlayerTest({}, async () => {
        const [first, second] = makeSources();
        await callPlayerAndExpectEvent(
          (player) => player.loadPlaylist({ sources: [first, second] }),
          EventType.Ready
        );
        await callPlayerAndExpectEvent(
          (player) => player.unload(),
          EventType.PlayerInactive
        );
        await callPlayer(async (player) => {
          expect(await player.playlist.getSources()).toHaveLength(0);
          expect(await player.getSource()).toBeUndefined();
        });
        expect(await first.isAttachedToPlayer()).toBeFalsy();
        expect(await second.isAttachedToPlayer()).toBeFalsy();
        await callPlayerAndExpectEvent(
          (player) => player.loadPlaylist({ sources: [second, first] }),
          EventType.Ready
        );
        await callPlayer(async (player) => {
          expect(await player.getSource()).toBe(second);
        });
      });
    });
  });
};
