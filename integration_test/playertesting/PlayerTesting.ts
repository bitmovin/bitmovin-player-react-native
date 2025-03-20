import {
  Player,
  PlayerConfig,
  Event,
  SourceConfig,
  ReadyEvent,
  TimeChangedEvent,
} from 'bitmovin-player-react-native';
import { EventType } from './EventType';
import PlayerTestWorld from './PlayerTestWorld';
import {
  SingleEventExpectation,
  MultipleEventsExpectation,
} from './expectations';

/**
 * Starts a player test with the given configuration and test function.
 * @param config The player configuration to use for the test. Pass `{}` to use the default configuration.
 * @param fn The test function to run.
 * @returns A promise that resolves when the test is finished.
 * @throws An error if the test fails.
 * @example
 * ```typescript
 * await startPlayerTest({}, async () => {
 *  // ...
 * });
 * ```
 * @see {@link PlayerConfig}
 */
export const startPlayerTest = async (
  config: PlayerConfig,
  fn: () => Promise<void>
): Promise<void> => {
  return await PlayerTestWorld.shared.startPlayerTest(config, fn);
};

/**
 * Calls the given function with the player instance.
 * @param fn The function to call.
 * @returns A promise that resolves when the function is finished.
 * @example
 * ```typescript
 * await callPlayer(async (player) => {
 *  // ...
 * });
 * ```
 * @see {@link Player}
 */
export const callPlayer = async <T>(
  fn: (player: Player) => Promise<T>
): Promise<T> => {
  return await PlayerTestWorld.shared.callPlayer(fn);
};

/**
 * Expects the given event to occur.
 * @param expectationConvertible The event to expect.
 * @param timeoutSeconds The number of seconds to wait for the event to occur.
 * @returns A promise that resolves when the function is finished.
 * @throws An error if the event does not occur.
 * @example
 * ```typescript
 * await callPlayerAndExpectEvent(async (player) => {
 *  // ...
 * }, EventType.Play);
 * ```
 * @see {@link Player}
 * @see {@link EventType}
 */
export const expectEvent = async <T extends Event>(
  expectationConvertible: SingleEventExpectation | EventType,
  timeoutSeconds: number = 10
): Promise<T> => {
  return await PlayerTestWorld.shared.expectEvent(
    expectationConvertible,
    timeoutSeconds
  );
};

/**
 * Expects the given events to occur.
 * @param expectationsConvertible The events to expect.
 * @param timeoutSeconds The number of seconds to wait for the events to occur.
 * @returns A promise that resolves when the function is finished.
 * @throws An error if the events do not occur.
 * @example
 * ```typescript
 * await callPlayerAndExpectEvents(async (player) => {
 *  // ...
 * }, [EventType.Play, EventType.Playing]);
 * ```
 *
 * ```typescript
 * await callPlayerAndExpectEvents(async (player) => {
 * // ...
 * }, EventSequence(EventType.Play, EventType.Playing));
 * ```
 * @see {@link Player}
 * @see {@link EventType}
 */
export const expectEvents = async (
  expectationsConvertible: MultipleEventsExpectation | EventType[],
  timeoutSeconds: number = 10
): Promise<Event[]> => {
  return await PlayerTestWorld.shared.expectEvents(
    expectationsConvertible,
    timeoutSeconds
  );
};

/**
 * Starts listening for the specified `SingleEventExpectation` before executing the passed `fn` function.
 * This is the race-condition-safe version of calling `callPlayer` and `expectEvent` after that.
 * Useful when events are directly tied to calls in the `fn` function block and therefore synchronously emitted.
 * @param fn The function to call.
 * @param expectationConvertible The event to expect.
 * @param timeoutSeconds The number of seconds to wait for the event to occur.
 * @returns A promise that resolves when the function is finished.
 * @throws An error if the event does not occur.
 * @example
 * ```typescript
 * await callPlayerAndExpectEvent(async (player) => {
 *  // ...
 * }, EventType.Play);
 * ```
 * @see {@link Player}
 * @see {@link EventType}
 */
export const callPlayerAndExpectEvent = async <E extends Event>(
  fn: (player: Player) => void,
  expectationConvertible: SingleEventExpectation | EventType,
  timeoutSeconds: number = 10
): Promise<E> => {
  return await PlayerTestWorld.shared.callPlayerAndExpectEvent(
    fn,
    expectationConvertible,
    timeoutSeconds
  );
};

/**
 * Starts listening for the specified `MultipleEventExpectation` before executing the passed `fn` function.
 * This is the race-condition-safe version of calling `callPlayer` and `expectEvents` after that.
 * Useful when events are directly tied to calls in the `fn` function block and therefore synchronously emitted.
 * @param fn The function to call.
 * @param expectationsConvertible The events to expect.
 * @param timeoutSeconds The number of seconds to wait for the events to occur.
 * @returns A promise that resolves when the function is finished.
 * @throws An error if the events do not occur.
 * @example
 * ```typescript
 * await callPlayerAndExpectEvents(async (player) => {
 *  // ...
 * }, [EventType.Play, EventType.Playing]);
 * ```
 *
 * ```typescript
 * await callPlayerAndExpectEvents(async (player) => {
 * // ...
 * }, EventSequence(EventType.Play, EventType.Playing));
 * ```
 * @see {@link Player}
 * @see {@link EventType}
 */
export const callPlayerAndExpectEvents = async (
  fn: (player: Player) => void,
  expectationsConvertible: MultipleEventsExpectation | EventType[],
  timeoutSeconds: number = 10
): Promise<Event[]> => {
  return await PlayerTestWorld.shared.callPlayerAndExpectEvents(
    fn,
    expectationsConvertible,
    timeoutSeconds
  );
};

/**
 * Loads the given source configuration and expects `ReadyEvent` to occur.
 * @param sourceConfig The source configuration to load.
 * @param timeoutSeconds The number of seconds to wait for the event to occur.
 * @returns A promise that resolves when the function is finished.
 * @throws An error if the event does not occur.
 * @example
 * ```typescript
 * await loadSourceConfig({
 *   url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
 *   type: SourceType.HLS,
 * });
 * ```
 * @see {@link SourceConfig}
 * @see {@link EventType}
 * @see {@link ReadyEvent}
 */
export const loadSourceConfig = async (
  sourceConfig: SourceConfig,
  timeoutSeconds: number = 10
): Promise<ReadyEvent> => {
  return await PlayerTestWorld.shared.loadSourceConfig(
    sourceConfig,
    timeoutSeconds
  );
};

/**
 * Plays the player for the given time and expects `TimeChangedEvent` to occur.
 * @param time The time to play for.
 * @param timeoutSeconds The number of seconds to wait for the event to occur.
 * @returns A promise that resolves when the function is finished.
 * @throws An error if the event does not occur.
 * @example
 * ```typescript
 * await playFor(5);
 * ```
 * @see {@link TimeChangedEvent}
 */
export const playFor = async (
  time: number,
  timeoutSeconds: number = 10
): Promise<TimeChangedEvent> => {
  return await PlayerTestWorld.shared.playFor(time, timeoutSeconds);
};

/**
 * Plays the player until the given time and expects `TimeChangedEvent` to occur.
 * @param time The time to play until.
 * @param timeoutSeconds The number of seconds to wait for the event to occur.
 * @returns A promise that resolves when the function is finished.
 * @throws An error if the event does not occur.
 * @example
 * ```typescript
 * await playUntil(5);
 * ```
 * @see {@link TimeChangedEvent}
 */
export const playUntil = async (
  time: number,
  timeoutSeconds: number = 10
): Promise<TimeChangedEvent> => {
  return await PlayerTestWorld.shared.playUntil(time, timeoutSeconds);
};
