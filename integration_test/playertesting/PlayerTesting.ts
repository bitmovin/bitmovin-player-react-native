import {
  Player,
  PlayerConfig,
  Event,
  SourceConfig,
  ReadyEvent,
  TimeChangedEvent,
} from 'bitmovin-player-react-native';
import { EventType } from './EventType';
import PlayerWorld from './PlayerWorld';
import {
  SingleEventExpectation,
  MultipleEventsExpectation,
} from './expectations';

export const startPlayerTest = async (
  config: PlayerConfig,
  fn: () => Promise<void>
): Promise<void> => {
  return await PlayerWorld.shared.startPlayerTest(config, fn);
};

export const callPlayer = async <T>(
  fn: (player: Player) => Promise<T>
): Promise<T> => {
  return await PlayerWorld.shared.callPlayer(fn);
};

export const expectEvent = async <T extends Event>(
  expectationConvertible: SingleEventExpectation | EventType,
  timeoutSeconds: number = 10
): Promise<T> => {
  return await PlayerWorld.shared.expectEvent(
    expectationConvertible,
    timeoutSeconds
  );
};

export const expectEvents = async (
  expectationsConvertible: MultipleEventsExpectation | EventType[],
  timeoutSeconds: number = 10
): Promise<Event[]> => {
  return await PlayerWorld.shared.expectEvents(
    expectationsConvertible,
    timeoutSeconds
  );
};

export const callPlayerAndExpectEvent = async <E extends Event, P>(
  fn: (player: Player) => Promise<P>,
  expectationConvertible: SingleEventExpectation | EventType,
  timeoutSeconds: number = 10
): Promise<E> => {
  return await PlayerWorld.shared.callPlayerAndExpectEvent(
    fn,
    expectationConvertible,
    timeoutSeconds
  );
};

export const callPlayerAndExpectEvents = async (
  fn: (player: Player) => void,
  expectationsConvertible: MultipleEventsExpectation | EventType[],
  timeoutSeconds: number = 10
): Promise<Event[]> => {
  return await PlayerWorld.shared.callPlayerAndExpectEvents(
    fn,
    expectationsConvertible,
    timeoutSeconds
  );
};

export const loadSourceConfig = async (
  sourceConfig: SourceConfig,
  timeoutSeconds: number = 10
): Promise<ReadyEvent> => {
  return await PlayerWorld.shared.loadSourceConfig(
    sourceConfig,
    timeoutSeconds
  );
};

export const playFor = async (
  time: number,
  timeoutSeconds: number = 10
): Promise<TimeChangedEvent> => {
  return await PlayerWorld.shared.playFor(time, timeoutSeconds);
};

export const playUntil = async (
  time: number,
  timeoutSeconds: number = 10
): Promise<TimeChangedEvent> => {
  return await PlayerWorld.shared.playUntil(time, timeoutSeconds);
};
