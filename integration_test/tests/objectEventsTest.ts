import { Player, Source } from 'bitmovin-player-react-native';
import type { Event } from 'bitmovin-player-react-native';
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
  subscribe: (listener: (event: Event) => void) => EventSubscription,
  trigger: () => void | Promise<void>
): Promise<Event> {
  let subscription: EventSubscription | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const received = new Promise<Event>((resolve, reject) => {
    timeout = setTimeout(
      () => reject(new Error('Object event timed out')),
      15000
    );
    subscription = subscribe(resolve);
  });
  try {
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
            const subscriptions = [
              viewPlayer.on('sourceLoaded', () => wrongPlayerEvents++),
              idleSource.on('sourceLoaded', () => wrongSourceEvents++),
              source.on('sourceLoaded', () => sourceLoads++),
              player.on('sourceLoaded', () => playerLoads++),
            ];
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
              player.destroy();
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
          const subscription = source.on('sourceLoaded', () => loads++);
          // Removing before lazy initialization finishes must also cancel registration.
          const removed = source.on('sourceLoaded', () => removedCalls++);
          removed.remove();
          try {
            await callPlayerAndExpectEvent((player) => {
              player.loadSource(source);
            }, EventType.Ready);
            await callPlayerAndExpectEvent((player) => {
              player.play();
            }, EventType.Playing);
            await callPlayerAndExpectEvent((player) => {
              player.unload();
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
              replacement.destroy();
            }
          } finally {
            subscription.remove();
          }
        });
      }
    );
  });
};
