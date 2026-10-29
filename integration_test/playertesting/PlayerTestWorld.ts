import {
  Player,
  PlayerConfig,
  ReadyEvent,
  SourceConfig,
  TimeChangedEvent,
} from 'bitmovin-player-react-native';
import uuid from 'react-native-uuid';
import { Event } from 'bitmovin-player-react-native';
import { EventType } from './EventType';
import { traceLoadEvent } from '../../src/utils/loadEventTrace';
import {
  SingleEventExpectation,
  PlainEvent,
  FilteredEvent,
} from './expectations/SingleEventExpectation';
import {
  MultipleEventsExpectation,
  EventSequence,
} from './expectations/MultipleEventsExpectation';

export default class PlayerTestWorld {
  static defaultLicenseKey: string | undefined;
  private static shared_: PlayerTestWorld | undefined;
  private player_: Player | undefined;
  private isFinished_: boolean = false;
  private eventListeners: { [key: string]: (event: Event) => void } = {};
  private viewReadiness:
    | {
        player: Player;
        promise: Promise<void>;
        acknowledge: () => void;
        retire: () => void;
      }
    | undefined;

  static get shared(): PlayerTestWorld {
    if (PlayerTestWorld.shared_ === undefined) {
      throw new Error('PlayerTestWorld.shared not initialized');
    }
    return PlayerTestWorld.shared_;
  }

  static set shared(playerTestWorld: PlayerTestWorld | undefined) {
    PlayerTestWorld.shared_ = playerTestWorld;
  }

  get player(): Player | undefined {
    return this.player_;
  }

  private set player(player: Player | undefined) {
    this.viewReadiness?.retire();
    this.viewReadiness = undefined;
    this.player_ = player;
    if (player) {
      let acknowledge = () => {};
      let retire = () => {};
      const promise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () =>
            reject(new Error(`Player view was not ready: ${player.nativeId}`)),
          10000
        );
        acknowledge = () => {
          clearTimeout(timeout);
          resolve();
        };
        retire = () => {
          clearTimeout(timeout);
          reject(
            new Error(
              `Player retired before view readiness: ${player.nativeId}`
            )
          );
        };
      });
      // Readiness may time out before a test makes its first player call.
      void promise.catch(() => {});
      this.viewReadiness = { player, promise, acknowledge, retire };
    }
    this.reRender();
  }

  onPlayerViewReady = (player: Player): void => {
    if (this.viewReadiness?.player === player) {
      this.viewReadiness.acknowledge();
    }
  };

  get isFinished(): boolean {
    return this.isFinished_;
  }

  onReRender: (() => void) | undefined;

  onEvent = (event: Event): void => {
    traceLoadEvent('js.world.receive', {
      event,
      playerId: this.player?.nativeId,
      currentSourceId: this.player?.source?.nativeId,
      listenerCount: Object.keys(this.eventListeners).length,
    });
    Object.entries(this.eventListeners).forEach(([_, listener]) =>
      listener(event)
    );
  };

  startPlayerTest = async (
    config: PlayerConfig,
    fn: () => Promise<void>
  ): Promise<void> => {
    if (config.licenseKey === undefined) {
      config.licenseKey = PlayerTestWorld.defaultLicenseKey;
    }

    const player = new Player({
      nativeId: `player-${uuid.v4()}`,
      ...config,
    });
    await player.initialize();
    traceLoadEvent('js.test.start', { playerId: player.nativeId });
    this.player = player;

    await fn().finally(() => {
      traceLoadEvent('js.test.teardown', {
        playerId: player.nativeId,
        currentSourceId: player.source?.nativeId,
      });
      player.destroy();
      this.isFinished_ = true;
      this.player = undefined;
      this.eventListeners = {};
    });
  };

  callPlayer = async <T>(fn: (player: Player) => Promise<T>): Promise<T> => {
    return await fn(await this.ensurePlayer());
  };

  expectEvent = async <T extends Event>(
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<T> => {
    return this.expectEventCalling(expectationConvertible, timeoutSeconds);
  };

  expectEvents = async (
    expectationsConvertible: MultipleEventsExpectation | EventType[],
    timeoutSeconds: number
  ): Promise<Event[]> => {
    return this.expectEventsCalling(expectationsConvertible, timeoutSeconds);
  };

  callPlayerAndExpectEvent = async <E extends Event>(
    fn: (player: Player) => void | Promise<void>,
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<E> => {
    return await this.expectEventCalling<E>(
      expectationConvertible,
      timeoutSeconds,
      async () => {
        await fn(await this.ensurePlayer());
      }
    );
  };

  callPlayerAndExpectEvents = async (
    fn: (player: Player) => void | Promise<void>,
    expectationsConvertible: MultipleEventsExpectation | EventType[],
    timeoutSeconds: number
  ): Promise<Event[]> => {
    return await this.expectEventsCalling(
      expectationsConvertible,
      timeoutSeconds,
      async () => {
        await fn(await this.ensurePlayer());
      }
    );
  };

  loadSourceConfig = async (
    sourceConfig: SourceConfig,
    timeoutSeconds: number = 10
  ): Promise<ReadyEvent> => {
    return await this.callPlayerAndExpectEvent(
      (player) => {
        player.load(sourceConfig);
      },
      EventType.Ready,
      timeoutSeconds
    );
  };

  playFor = async (
    time: number,
    timeoutSeconds: number
  ): Promise<TimeChangedEvent> => {
    const player = await this.ensurePlayer();
    const currentTime = await player.getCurrentTime();
    const targetTime = currentTime + time;
    return await this.playUntil(targetTime, timeoutSeconds);
  };

  playUntil = async (
    time: number,
    timeoutSeconds: number
  ): Promise<TimeChangedEvent> => {
    return await this.callPlayerAndExpectEvent<TimeChangedEvent>(
      (player) => {
        player.play();
      },
      FilteredEvent<TimeChangedEvent>(
        EventType.TimeChanged,
        (event) => event.currentTime >= time
      ),
      timeoutSeconds
    );
  };

  private ensurePlayer = async (): Promise<Player> => {
    const player = this.player;
    if (player !== undefined) {
      if (player.isDestroyed) {
        throw new Error(
          'Player was destroyed. Did you forget to call "startPlayerTest" again?'
        );
      }
      await this.viewReadiness?.promise;
      if (this.player !== player || player.isDestroyed) {
        throw new Error('Player was retired while waiting for view readiness.');
      }
      return player;
    }
    throw new Error("It seems you forgot to call 'startPlayerTest' first.");
  };

  private reRender = (): void => {
    if (this.onReRender === undefined) {
      throw new Error('onReRender not set');
    }
    this.onReRender();
  };

  private expectEventCalling = async <T extends Event>(
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number,
    afterListenerAttached: () => Promise<void> = async () => Promise.resolve()
  ): Promise<T> => {
    let actualExpectation: SingleEventExpectation;
    if (expectationConvertible instanceof SingleEventExpectation) {
      actualExpectation = expectationConvertible;
    } else {
      actualExpectation = PlainEvent(expectationConvertible as EventType);
    }
    const expectationId = uuid.v4() as string;
    const trace = (stage: string, event?: Event, matched?: boolean) =>
      traceLoadEvent(stage, {
        expectationId,
        playerId: this.player?.nativeId,
        currentSourceId: this.player?.source?.nativeId,
        expected: [actualExpectation.eventType],
        pending: actualExpectation.isFulfilled
          ? []
          : [actualExpectation.eventType],
        event,
        matched,
      });
    let resolve: (event: T) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const future = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const removeListener = this.addEventListener((event) => {
      const matched = actualExpectation.maybeFulfillExpectation(event);
      trace('js.expectation.event', event, matched);
      if (matched) {
        resolve(event as T);
      }
    });
    const timeoutHandle = setTimeout(() => {
      if (!actualExpectation.isFulfilled) {
        trace('js.expectation.timeout');
        removeListener();
        reject(new Error(`Expectation was not met: ${actualExpectation}`));
      }
    }, timeoutSeconds * 1000);
    trace('js.expectation.attach');
    // The expectation can time out while the trigger is still running.
    void future.catch(() => {});
    try {
      trace('js.expectation.trigger');
      await afterListenerAttached();
      return await future;
    } finally {
      clearTimeout(timeoutHandle);
      removeListener();
    }
  };

  private expectEventsCalling = async (
    expectationsConvertible: MultipleEventsExpectation | EventType[],
    timeoutSeconds: number,
    afterListenerAttached: () => Promise<void> = async () => Promise.resolve()
  ): Promise<Event[]> => {
    let actualExpectation: MultipleEventsExpectation;
    if (expectationsConvertible instanceof MultipleEventsExpectation) {
      actualExpectation = expectationsConvertible;
    } else {
      actualExpectation = EventSequence(
        ...Array.from(expectationsConvertible as EventType[]).map((eventType) =>
          PlainEvent(eventType)
        )
      );
    }
    const expectationId = uuid.v4() as string;
    const trace = (stage: string, event?: Event, matched?: boolean) =>
      traceLoadEvent(stage, {
        expectationId,
        playerId: this.player?.nativeId,
        currentSourceId: this.player?.source?.nativeId,
        expected: actualExpectation.singleExpectations.map((e) => e.eventType),
        pending: actualExpectation.singleExpectations
          .filter((e) => !e.isFulfilled)
          .map((e) => e.eventType),
        event,
        matched,
      });
    let fulfilledExpectations = 0;
    const receivedEvents: Event[] = [];
    let resolve: (event: Event[]) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const future = new Promise<Event[]>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const removeListener = this.addEventListener((event) => {
      const matched = actualExpectation.isNextExpectationMet(event);
      trace('js.expectation.event', event, matched);
      if (matched) {
        fulfilledExpectations++;
        receivedEvents.push(event);
        if (
          fulfilledExpectations >= actualExpectation.expectedFulfillmentCount
        ) {
          resolve(receivedEvents);
        }
      }
    });
    const timeoutHandle = setTimeout(() => {
      if (fulfilledExpectations < actualExpectation.expectedFulfillmentCount) {
        trace('js.expectation.timeout');
        removeListener();
        reject(new Error(`Expectation was not met: ${actualExpectation}`));
      }
    }, timeoutSeconds * 1000);
    trace('js.expectation.attach');
    // The expectation can time out while the trigger is still running.
    void future.catch(() => {});
    try {
      trace('js.expectation.trigger');
      await afterListenerAttached();
      return await future;
    } finally {
      clearTimeout(timeoutHandle);
      removeListener();
    }
  };

  private addEventListener = <T extends Event>(
    listener: (event: T) => void
  ): (() => void) => {
    const key = uuid.v4() as string;
    this.eventListeners[key] = async (event) => listener(event as T);
    return () => {
      delete this.eventListeners[key];
    };
  };
}
