import { Source, SourceAddedEvent } from 'bitmovin-player-react-native';
import { TestScope } from 'cavy';
import {
  callPlayerAndExpectEvent,
  callPlayerAndExpectEvents,
  EventSequence,
  FilteredEvent,
  EventType,
  startPlayerTest,
} from '../playertesting';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';

const sourceAdded = EventType.SourceAdded;

export default (spec: TestScope) => {
  spec.describe('Source metadata', () => {
    spec.it(
      'includes configured metadata in SourceAdded before preparation',
      async () => {
        await startPlayerTest({}, async () => {
          const sources = ['first', 'second'].map(
            (tag) =>
              new Source({
                ...Sources.artOfMotionHls,
                metadata: { tag },
              })
          );
          const events = await callPlayerAndExpectEvents(
            (player) => player.loadPlaylist({ sources }),
            EventSequence(
              FilteredEvent<SourceAddedEvent>(
                sourceAdded,
                (event) => event.index === 0
              ),
              FilteredEvent<SourceAddedEvent>(
                sourceAdded,
                (event) => event.index === 1
              )
            )
          );
          const [first, second] = events as SourceAddedEvent[];
          expect(first.source.metadata).toEqual({ tag: 'first' });
          expect(second.source.metadata).toEqual({ tag: 'second' });
        });
      }
    );
    spec.it('preserves metadata set before loading', async () => {
      await startPlayerTest({}, async () => {
        const source = new Source(Sources.artOfMotionHls);
        await source.setMetadata({ tag: 'updated before load' });
        await callPlayerAndExpectEvent(
          (player) => player.loadSource(source),
          EventType.Ready
        );
        expect(await source.metadata()).toEqual({ tag: 'updated before load' });
      });
    });
  });
};
