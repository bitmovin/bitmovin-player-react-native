import { TestScope } from 'cavy';
import { loadSourceConfig, playFor, startPlayerTest } from '../playertesting';
import { SourceType } from 'bitmovin-player-react-native';

export default (spec: TestScope) => {
  spec.describe('player', () => {
    spec.it('loads source and plays for 5 seconds', async () => {
      await startPlayerTest({}, async () => {
        await loadSourceConfig({
          url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
          type: SourceType.HLS,
        });
        await playFor(5);
      });
    });
  });
};
