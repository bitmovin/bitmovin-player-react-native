import { Player, PlayerConfig } from 'bitmovin-player-react-native';
import PlayerTestWorld from './PlayerTestWorld';

/**
 * Helpers for tests that use a {@link Player} without a `PlayerView`, e.g. via {@link Player.on}.
 */

/**
 * Polls `condition` until it is met or `timeoutMs` passed.
 *
 * @returns Whether `condition` was met.
 */
export const waitUntil = async (
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 10000
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) {
      return true;
    }
    await delay(100);
  }
  return false;
};

/**
 * Resolves after `ms` milliseconds.
 */
export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Loads via `load` and starts playback once the player is ready, as `play` has no effect before.
 */
export const playWhenReady = async (player: Player, load: () => void) => {
  let isReady = false;
  const onReady = () => {
    isReady = true;
  };
  player.on('ready', onReady);
  load();
  const ready = await waitUntil(() => isReady);
  player.off('ready', onReady);
  if (!ready) {
    throw new Error('Ready should be received');
  }
  player.play();
};

/**
 * Creates a player with the license key of the test app, as `startPlayerTest` does, unless `config` sets one.
 */
export const createPlayer = (config: PlayerConfig = {}) =>
  new Player({ licenseKey: PlayerTestWorld.defaultLicenseKey, ...config });

/**
 * Runs `fn` with a player that is not attached to any `PlayerView` and destroys it afterwards.
 */
export const withPlayer = async (fn: (player: Player) => Promise<void>) => {
  const player = createPlayer();
  try {
    await fn(player);
  } finally {
    player.destroy();
  }
};
