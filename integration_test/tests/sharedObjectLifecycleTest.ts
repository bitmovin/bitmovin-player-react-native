import { Player } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayer,
  callPlayerAndExpectEvent,
  EventType,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { Sources } from './helper/Sources';

async function remountPlayerView(player: Player): Promise<void> {
  const world = PlayerTestWorld.shared;
  const reRender = world.onReRender;
  if (!reRender) throw new Error('The player test view is not mounted');
  const previousOnReady = world.onPlayerViewReady;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const ready = new Promise<void>((resolve, reject) => {
    timeout = setTimeout(
      () =>
        reject(new Error('The replacement player view did not become ready')),
      10000
    );
    world.onPlayerViewReady = (readyPlayer) => {
      previousOnReady(readyPlayer);
      if (readyPlayer === player) resolve();
    };
  });
  try {
    reRender();
    await ready;
  } finally {
    clearTimeout(timeout);
    world.onPlayerViewReady = previousOnReady;
  }
}

export default (spec: TestScope) => {
  spec.describe('SharedObject view ownership', () => {
    spec.it(
      'keeps playback working after its native view is remounted',
      async () => {
        await startPlayerTest({}, async () => {
          await loadSourceConfig(Sources.artOfMotionHls);
          await callPlayer(remountPlayerView);
          await callPlayerAndExpectEvent((player) => {
            player.play();
          }, EventType.Playing);
        });
      }
    );
  });
};
