import {
  OfflineContentManager,
  Player,
  Source,
  SourceType,
  type SourceUnloadedEvent,
} from 'bitmovin-player-react-native';
import type { TestScope } from 'cavy';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { receiveEvent } from '../playertesting/receiveEvent';
import { expect } from './helper/Expect';
import { fixtureUrl } from './helper/FixtureUrl';

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
          await receiveEvent(
            async (resolve, reject) => ({
              remove: manager.addListener({
                onOptionsAvailable: resolve,
                onError: (event) => reject(new Error(event.message)),
              }),
            }),
            () => manager.getOptions()
          );
          await receiveEvent(
            async (resolve, reject) => ({
              remove: manager.addListener({
                onCompleted: resolve,
                onError: (event) => reject(new Error(event.message)),
              }),
            }),
            () => manager.download({ minimumBitrate: 0 })
          );
          await receiveEvent(
            (resolve) => player.on('ready', resolve),
            () => player.loadOfflineContent(manager)
          );
          const source = await player.getSource();
          if (!source)
            throw new Error('The offline load did not expose its Source');
          expect(source instanceof Source).toBe(true);
          expect(source.config?.title).toBe(title);

          // No duration/isActive/repeated query before subscribing: those can initialize a lazy peer.
          const unloaded = await receiveEvent<SourceUnloadedEvent>(
            (resolve) => source.on('sourceUnloaded', resolve),
            () => player.unload()
          );
          expect(Boolean(unloaded.source)).toBe(true);
          expect(typeof unloaded.source?.duration).toBe('number');

          await receiveEvent(
            (resolve) => player.on('ready', resolve),
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
