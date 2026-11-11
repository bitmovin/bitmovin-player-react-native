import { Player, Source } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { showBoundaryView } from '../src/ViewBoundaryHarness';
import { Sources } from './helper/Sources';

function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function event(
  player: Player,
  name: 'ready' | 'playing',
  trigger: () => Promise<void>
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let done = () => {};
  const received = new Promise<void>((resolve, reject) => {
    done = resolve;
    timeout = setTimeout(
      () => reject(new Error(`No native ${name} event`)),
      25000
    );
  });
  void received.catch(() => {});
  const subscription = await player.on(name, done);
  try {
    await trigger();
    await received;
  } finally {
    clearTimeout(timeout);
    subscription.remove();
  }
}
export default (spec: TestScope) => {
  spec.describe('SharedObject view method boundary', () => {
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
          // Deliberately no initialize(), isMuted(), or other hidden readiness call before mount.
          await showBoundaryView({ player: first });
          check(!Object.isFrozen(first), 'Fabric froze the public Player');
          check(
            !Object.isFrozen(first.buffer),
            'Fabric reached its owned Buffer API'
          );
          check(
            first.isInitialized,
            'Public immediate mount did not await constructor initialization'
          );
          await event(first, 'ready', () => first.loadSource(firstSource));
          check(
            first.source === firstSource,
            'Ordinary mutable Source field did not update'
          );
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
          await showBoundaryView();
          await Promise.all([first.destroy(), second.destroy()]);
        }
      }
    );
  });
};
