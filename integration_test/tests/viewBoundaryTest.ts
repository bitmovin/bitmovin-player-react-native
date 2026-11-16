import { Player, Source } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { showBoundaryView } from '../src/ViewBoundaryHarness';
import { Sources } from './helper/Sources';
import { receiveEvent } from '../playertesting/receiveEvent';

function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function event(
  player: Player,
  name: 'ready' | 'playing',
  trigger: () => Promise<void>
): Promise<void> {
  await receiveEvent(
    async (listener) => {
      player.on(name, listener);
      return { remove: () => player.off(name, listener) };
    },
    trigger,
    25000
  );
}
export default (spec: TestScope) => {
  spec.describe('native view method boundary', () => {
    spec.it(
      'mounts immediately and replaces players without freezing public API objects',
      async () => {
        let requests = 0;
        const first = new Player({
          licenseKey: PlayerTestWorld.defaultLicenseKey,
          networkConfig: {
            preprocessHttpRequest: (_type, request) => {
              requests++;
              return Promise.resolve(request);
            },
          },
        });
        const second = new Player({
          licenseKey: PlayerTestWorld.defaultLicenseKey,
        });
        const firstSource = new Source({
          ...Sources.artOfMotionHls,
          title: 'first boundary source',
        });
        const secondSource = new Source({
          ...Sources.artOfMotionHls,
          title: 'second boundary source',
        });
        try {
          // No caller initialization or getter precedes the first mount.
          await showBoundaryView({ player: first });
          check(!Object.isFrozen(first), 'Fabric froze the public Player');
          check(
            !Object.isFrozen(first.buffer),
            'Fabric reached its owned Buffer API'
          );
          await event(first, 'ready', () => first.loadSource(firstSource));
          check(
            (await first.getSource()) === firstSource,
            'Source identity changed across view boundary'
          );
          await event(first, 'playing', () => first.play());
          check(requests > 0, 'Native HTTP callback did not resume playback');
          await showBoundaryView({ player: second });
          check(!Object.isFrozen(second), 'Replacement Player was frozen');
          await event(second, 'ready', () => second.loadSource(secondSource));
          await event(second, 'playing', () => second.play());
          check(
            (await second.getSource()) === secondSource,
            'Replacement retained the previous Source'
          );
          await showBoundaryView({ player: first });
          check(
            (await first.getSource()) === firstSource,
            'Replacing the view destroyed the previous Player'
          );
          await first.destroy();
          check(first.isDestroyed, 'Ordinary destroy field could not mutate');
        } finally {
          try {
            await showBoundaryView();
          } finally {
            try {
              await first.destroy();
            } finally {
              await second.destroy();
            }
          }
        }
      }
    );
  });
};
