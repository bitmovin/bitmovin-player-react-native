import {
  OfflineContentManager,
  Player,
  Source,
  SourceType,
  type SourceUnloadedEvent,
} from 'bitmovin-player-react-native';
import type { TestScope } from 'cavy';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { expect } from './helper/Expect';
import { fixtureUrl } from './helper/FixtureUrl';

// Event infrastructure only: install before the trigger and dispose on every exit.
async function receiving<T>(
  subscribe: (
    resolve: (event: T) => void,
    reject: (error: Error) => void
  ) => Promise<() => void> | (() => void),
  trigger: () => Promise<void>
): Promise<T> {
  let remove: (() => void) | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let resolve: (event: T) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const event = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
    timeout = setTimeout(
      () => rej(new Error('Offline event timed out')),
      15000
    );
  });
  void event.catch(() => {});
  try {
    remove = await subscribe(resolve, reject);
    await trigger();
    return await event;
  } finally {
    clearTimeout(timeout);
    remove?.();
  }
}

export default (spec: TestScope) => {
  spec.describe('offline Source ownership', () => {
    spec.it(
      'adopts an offline Source with events and stable query identity',
      async () => {
        const title = 'Offline query';
        const manager = new OfflineContentManager({
          identifier: `cavy-offline-peer-${Date.now()}`,
          sourceConfig: {
            url: fixtureUrl('positioned-webvtt/master.m3u8'),
            type: SourceType.HLS,
            title,
          },
        });
        const player = new Player({
          licenseKey: PlayerTestWorld.defaultLicenseKey,
          remoteControlConfig: { isCastEnabled: false },
        });
        try {
          await receiving(
            (resolve, reject) =>
              manager.addListener({
                onOptionsAvailable: resolve,
                onError: (event) => reject(new Error(event.message)),
              }),
            () => manager.getOptions()
          );
          await receiving(
            (resolve, reject) =>
              manager.addListener({
                onCompleted: resolve,
                onError: (event) => reject(new Error(event.message)),
              }),
            () => manager.download({ minimumBitrate: 0 })
          );
          await receiving(
            async (resolve) => {
              const subscription = await player.on('ready', resolve);
              return () => subscription.remove();
            },
            () => player.loadOfflineContent(manager)
          );
          const source = await player.getSource();
          if (!source)
            throw new Error('The offline load did not expose its Source');
          expect(source instanceof Source).toBe(true);
          expect(source.config?.title).toBe(title);

          // No duration/isActive/repeated query before subscribing: those can initialize a lazy peer.
          const unloaded = await receiving<SourceUnloadedEvent>(
            async (resolve) => {
              const subscription = await source.on('sourceUnloaded', resolve);
              return () => subscription.remove();
            },
            () => player.unload()
          );
          expect(Boolean(unloaded.source)).toBe(true);
          expect(typeof unloaded.source?.duration).toBe('number');

          await receiving(
            async (resolve) => {
              const subscription = await player.on('ready', resolve);
              return () => subscription.remove();
            },
            () => player.loadOfflineContent(manager)
          );
          const reloaded = await player.getSource();
          if (!reloaded)
            throw new Error('The reloaded offline Source is missing');
          expect(await player.getSource()).toBe(reloaded);
          expect((await player.playlist.getSources())[0]).toBe(reloaded);
        } finally {
          try {
            await player.destroy();
          } finally {
            try {
              await manager.deleteAll();
            } finally {
              await manager.destroy();
            }
          }
        }
      }
    );
  });
};
