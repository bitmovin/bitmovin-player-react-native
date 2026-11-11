import { Player, Source } from 'bitmovin-player-react-native';
import type { Event, SourceUnloadedEvent } from 'bitmovin-player-react-native';
import type { EventSubscription } from 'expo-modules-core';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

// Register before the trigger, and always release the listener and deadline.
async function receiving(
  subscribe: (listener: (event: Event) => void) => Promise<EventSubscription>,
  trigger: () => void | Promise<void>
): Promise<Event> {
  let subscription: EventSubscription | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let listener: (event: Event) => void = () => {};
  const received = new Promise<Event>((resolve, reject) => {
    timeout = setTimeout(
      () => reject(new Error('Object event timed out')),
      15000
    );
    listener = resolve;
  });
  try {
    subscription = await subscribe(listener);
    await trigger();
    return await received;
  } finally {
    clearTimeout(timeout);
    subscription?.remove();
  }
}

export default (spec: TestScope) => {
  spec.describe('native object events', () => {
    spec.it(
      'includes the owning Source metadata in its unload event',
      async () => {
        await startPlayerTest({}, async () => {
          const source = new Source({
            ...Sources.artOfMotionHls,
            metadata: { item: 'unloaded' },
          });
          await callPlayerAndExpectEvent(
            (player) => player.loadSource(source),
            EventType.Ready
          );
          const event = (await receiving(
            (listener) => source.on('sourceUnloaded', listener),
            () => callPlayer((player) => player.unload())
          )) as SourceUnloadedEvent;
          expect(event.source?.metadata).toEqual({ item: 'unloaded' });
        });
      }
    );

    spec.it(
      'keeps source listeners after removing and adding it again',
      async () => {
        await startPlayerTest({}, async () => {
          const first = new Source(Sources.artOfMotionHls);
          const second = new Source(Sources.sintel);
          await callPlayerAndExpectEvent(
            (player) =>
              player.loadPlaylist({
                sources: [first, second],
                options: { preloadAllSources: false },
              }),
            EventType.Ready
          );
          await receiving(
            (listener) => second.on('sourceLoaded', listener),
            () =>
              callPlayer(async (player) => {
                await player.playlist.remove(second);
                await player.playlist.add(second);
                await player.playlist.seek(second, 0);
              })
          );
        });
      }
    );

    spec.it(
      'keeps retained sources usable after their player is destroyed',
      async () => {
        const player = new Player({
          licenseKey: PlayerTestWorld.defaultLicenseKey,
        });
        const replacement = new Player({
          licenseKey: PlayerTestWorld.defaultLicenseKey,
        });
        const first = new Source(Sources.artOfMotionHls);
        const removed = new Source(Sources.sintel);
        try {
          await receiving(
            (listener) => player.on('ready', listener),
            () => player.loadPlaylist({ sources: [first, removed] })
          );
          await player.playlist.remove(removed);
          await receiving(
            (listener) => first.on('sourceUnloaded', listener),
            () => player.destroy()
          );
          await receiving(
            (listener) => replacement.on('ready', listener),
            () => replacement.loadPlaylist({ sources: [first, removed] })
          );
          const sources = await replacement.playlist.getSources();
          expect(sources).toHaveLength(2);
          expect(sources[0]).toBe(first);
          expect(sources[1]).toBe(removed);
        } finally {
          try {
            await player.destroy();
          } finally {
            await replacement.destroy();
          }
        }
      }
    );

    spec.it(
      'delivers headless events only to the owning player and source',
      async () => {
        await startPlayerTest({}, async () => {
          await callPlayer(async (viewPlayer) => {
            const player = new Player({
              licenseKey: PlayerTestWorld.defaultLicenseKey,
            });
            const source = new Source(Sources.artOfMotionHls);
            const idleSource = new Source(Sources.artOfMotionHls);
            let wrongPlayerEvents = 0;
            let wrongSourceEvents = 0;
            let sourceLoads = 0;
            let playerLoads = 0;
            const subscriptions = await Promise.all([
              viewPlayer.on('sourceLoaded', () => wrongPlayerEvents++),
              idleSource.on('sourceLoaded', () => wrongSourceEvents++),
              source.on('sourceLoaded', () => sourceLoads++),
              player.on('sourceLoaded', () => playerLoads++),
            ]);
            try {
              // Readiness is a barrier for checking load delivery and isolation.
              await receiving(
                (listener) => player.on('ready', listener),
                () => player.loadSource(source)
              );
              expect(sourceLoads, 'Owning source receives its load').toBe(1);
              expect(
                playerLoads,
                'Owning player forwards its source load'
              ).toBe(1);
              expect(wrongSourceEvents, 'Other source remains isolated').toBe(
                0
              );
              expect(wrongPlayerEvents, 'Other player remains isolated').toBe(
                0
              );
              await receiving(
                (listener) => player.on('destroy', listener),
                () => player.destroy()
              );
            } finally {
              subscriptions.forEach((subscription) => subscription.remove());
              await player.destroy();
            }
          });
        });
      }
    );

    spec.it(
      'forwards view callbacks and preserves source listeners across players',
      async () => {
        await startPlayerTest({}, async () => {
          const source = new Source(Sources.artOfMotionHls);
          let loads = 0;
          let removedCalls = 0;
          const subscription = await source.on('sourceLoaded', () => loads++);
          // A removed subscription must stay silent during both attachments.
          const removed = await source.on('sourceLoaded', () => removedCalls++);
          removed.remove();
          try {
            await callPlayerAndExpectEvent(async (player) => {
              await player.loadSource(source);
            }, EventType.Ready);
            await callPlayerAndExpectEvent(async (player) => {
              await player.play();
            }, EventType.Playing);
            await callPlayerAndExpectEvent(async (player) => {
              await player.unload();
            }, EventType.SourceUnloaded);
            const replacement = new Player({
              licenseKey: PlayerTestWorld.defaultLicenseKey,
            });
            try {
              await receiving(
                (listener) => replacement.on('ready', listener),
                () => replacement.loadSource(source)
              );
              expect(loads, 'Source emits for each native attachment').toBe(2);
              expect(removedCalls, 'Removed subscription stays silent').toBe(0);
            } finally {
              await replacement.destroy();
            }
          } finally {
            subscription.remove();
          }
        });
      }
    );
  });
};
