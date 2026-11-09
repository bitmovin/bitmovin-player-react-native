import { Platform } from 'react-native';
import {
  Player,
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
import PlayerTestWorld from '../playertesting/PlayerTestWorld';

const sourceAdded =
  Platform.OS === 'ios' ? EventType.SourceAddedEvent : EventType.SourceAdded;
const sourceRemoved =
  Platform.OS === 'ios'
    ? EventType.SourceRemovedEvent
    : EventType.SourceRemoved;

const sourceMetadata = async (sources: Source[]) =>
  Promise.all(sources.map((source) => source.metadata()));

const makeSources = () => [
  new Source({ ...Sources.artOfMotionHls, metadata: { item: 'first' } }),
  new Source({ ...Sources.sintel, metadata: { item: 'second' } }),
];

// Assert SDK state and events. Source queries return independent JS handles.
export default (spec: TestScope) => {
  spec.describe('native playlist', () => {
    spec.it('delivers playlist events without a mounted view', async () => {
      const player = new Player({
        licenseKey: PlayerTestWorld.defaultLicenseKey,
      });
      const [first, second] = makeSources();
      const added: number[] = [];
      const addedSubscription = await player.on(
        Platform.OS === 'ios' ? 'sourceAddedEvent' : 'sourceAdded',
        (event) => added.push(event.index)
      );
      const receiving = async (
        subscribe: (listener: () => void) => Promise<{ remove(): void }>,
        trigger: () => Promise<void>
      ) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let subscription: { remove(): void } | undefined;
        let notify!: () => void;
        const received = new Promise<void>((resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Headless playlist event timed out')),
            15000
          );
          notify = resolve;
        });
        void received.catch(() => {});
        try {
          subscription = await subscribe(notify);
          await trigger();
          await received;
        } finally {
          clearTimeout(timeout);
          subscription?.remove();
        }
      };
      try {
        await receiving(
          (listener) => player.on('ready', listener),
          () => player.loadPlaylist({ sources: [first, second] })
        );
        expect(added).toEqual([0, 1]);
        await receiving(
          (listener) => player.on('playlistTransition', listener),
          () => player.playlist.seek(second, 0)
        );
        expect(await (await player.getSource())?.metadata()).toEqual({
          item: 'second',
        });
        await receiving(
          (listener) =>
            player.on(
              Platform.OS === 'ios' ? 'sourceRemovedEvent' : 'sourceRemoved',
              listener
            ),
          () => player.playlist.remove(first)
        );
        expect(
          await sourceMetadata(await player.playlist.getSources())
        ).toEqual([{ item: 'second' }]);
      } finally {
        addedSubscription.remove();
        player.destroy();
      }
    });

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
            expect(
              await sourceMetadata(await player.playlist.getSources())
            ).toEqual([{ item: 'first' }, { item: 'second' }]);
            const active = await player.getSource();
            expect(await active?.isActive()).toBeTruthy();
            expect(await active?.isAttachedToPlayer()).toBeTruthy();
            expect(await (await player.getSource())?.metadata()).toEqual({
              item: 'first',
            });
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
          const target = await callPlayer(
            async (player) => (await player.playlist.getSources())[1]
          );
          const event = await callPlayerAndExpectEvent<PlaylistTransitionEvent>(
            (player) => player.playlist.seek(target!, 10),
            EventType.PlaylistTransition
          );
          expect(event.from.metadata?.item).toBe('first');
          expect(event.to.metadata?.item).toBe('second');
          await callPlayer(async (player) => {
            expect(await (await player.getSource())?.metadata()).toEqual({
              item: 'second',
            });
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
          expect(await (await player.getSource())?.metadata()).toEqual({
            item: 'second',
          });
        });
      });
    });

    spec.it(
      'adds, removes and reuses a source without recreating it',
      async () => {
        await startPlayerTest({}, async () => {
          const [first, second] = makeSources();
          const third = new Source({
            ...Sources.artOfMotionHls,
            metadata: { item: 'third' },
          });
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
            expect(
              await sourceMetadata(await player.playlist.getSources())
            ).toEqual([
              { item: 'first' },
              { item: 'third' },
              { item: 'second' },
            ]);
          });
          const queriedThird = await callPlayer(
            async (player) => (await player.playlist.getSources())[1]
          );
          const removed = await callPlayerAndExpectEvent<SourceRemovedEvent>(
            (player) => player.playlist.remove(queriedThird!),
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
            expect(
              await sourceMetadata(await player.playlist.getSources())
            ).toEqual([{ item: 'first' }, { item: 'third' }]);
          });
        });
      }
    );

    spec.it('preloads inactive sources when requested', async () => {
      await startPlayerTest({}, async () => {
        const [first, second] = makeSources();
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let notifyLoaded!: () => void;
        const loaded = new Promise<void>((resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Inactive source did not preload')),
            30000
          );
          notifyLoaded = resolve;
        });
        void loaded.catch(() => {});
        const subscription = await second.on('sourceLoaded', notifyLoaded);
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
          subscription.remove();
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
          expect(await (await player.getSource())?.metadata()).toEqual({
            item: 'second',
          });
        });
      });
    });
  });
};
