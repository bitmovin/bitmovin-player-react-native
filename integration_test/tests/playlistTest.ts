import { TestScope } from 'cavy';
import { Platform } from 'react-native';
import {
  Player,
  PlaylistEventByType,
  PlaylistEventType,
  ReplayMode,
  Source,
  SourceConfig,
} from 'bitmovin-player-react-native';
import {
  callPlayer,
  expectEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

function titled(config: SourceConfig, title: string): Source {
  return new Source({ ...config, title, metadata: { title } });
}

export async function callPlaylistAndExpectEvent<T extends PlaylistEventType>(
  player: Player,
  type: T,
  action: () => Promise<void>,
  predicate: (event: PlaylistEventByType<T>) => boolean = () => true
): Promise<PlaylistEventByType<T>> {
  let subscription: { remove: () => void } | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const eventPromise = new Promise<PlaylistEventByType<T>>(
    (resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${type}`));
      }, 10000);
      subscription = player.playlist.addEventListener(type, (event) => {
        if (predicate(event)) {
          resolve(event);
        }
      });
    }
  );
  try {
    const [event] = await Promise.all([
      eventPromise,
      Promise.resolve().then(action),
    ]);
    return event;
  } finally {
    clearTimeout(timeout);
    subscription?.remove();
  }
}

async function checkLoad(first: Source, second: Source) {
  await Promise.all([
    expectEvent(EventType.SourceLoaded, 20),
    callPlayer(async (player) => {
      const event = await callPlaylistAndExpectEvent(
        player,
        'sourceAdded',
        () =>
          player.loadPlaylist([first, second], {
            replayMode: ReplayMode.PLAYLIST,
          }),
        (event) => event.sourceNativeId === first.nativeId
      );
      expect(event.timestamp, 'SourceAdded timestamp').toBeGreaterThan(0);
      expect(
        (await player.playlist.getSources()).map((source) => source.nativeId),
        'Initial playlist source IDs'
      ).toEqual([first.nativeId, second.nativeId]);
    }),
  ]);
}

async function checkTransition(source: Source) {
  await callPlayer(async (player) => {
    const event = await callPlaylistAndExpectEvent(
      player,
      'playlistTransition',
      () => player.playlist.seek(source, 0),
      (event) => event.toSourceNativeId === source.nativeId
    );
    expect(event.timestamp, 'PlaylistTransition timestamp').toBeGreaterThan(0);
    expect(event.toSourceReference, 'Transition source identity').toBe(source);
    expect(player.source, 'Player active source').toBe(source);
  });
}

async function checkSourceRoundTrip(
  player: Player,
  source: Source,
  initialIds: string[]
) {
  const added = await callPlaylistAndExpectEvent(
    player,
    'sourceAdded',
    () => player.playlist.add(source),
    (event) => event.sourceNativeId === source.nativeId
  );
  expect(added.timestamp, 'Added timestamp').toBeGreaterThan(0);
  expect(added.sourceReference, 'Added source identity').toBe(source);
  expect(
    (await player.playlist.getSources()).map((entry) => entry.nativeId),
    'Playlist after add'
  ).toEqual([...initialIds, source.nativeId]);

  const removed = await callPlaylistAndExpectEvent(
    player,
    'sourceRemoved',
    () => player.playlist.remove(source),
    (event) => event.sourceNativeId === source.nativeId
  );
  expect(removed.timestamp, 'Removed timestamp').toBeGreaterThan(0);
  expect(removed.sourceReference, 'Removed source identity').toBe(source);
  expect(
    (await player.playlist.getSources()).map((entry) => entry.nativeId),
    'Playlist after remove'
  ).toEqual(initialIds);
}

export default (spec: TestScope) => {
  spec.describe('playlist', () => {
    spec.it(
      'loads, transitions, adds, removes, and lists sources',
      async () => {
        await startPlayerTest({}, async () => {
          const first = titled(
            Platform.OS === 'ios'
              ? Sources.artOfMotionHls
              : Sources.artOfMotionDash,
            'Art of Motion'
          );
          const second = titled(Sources.sintel, 'Sintel');
          const third = titled(Sources.bigBuckBunnyHls, 'Big Buck Bunny');
          const duplicateSecond = titled(Sources.sintel, 'Sintel');

          await checkLoad(first, second);
          await checkTransition(second);
          await callPlayer(async (player) => {
            for (const source of [third, duplicateSecond]) {
              await checkSourceRoundTrip(player, source, [
                first.nativeId,
                second.nativeId,
              ]);
            }
          });
        });
      }
    );
  });
};
