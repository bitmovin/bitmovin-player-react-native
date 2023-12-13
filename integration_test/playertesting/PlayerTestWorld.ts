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
    this.player_ = player;
    this.reRender();
  }

  get isFinished(): boolean {
    return this.isFinished_;
  }

  onReRender: (() => void) | undefined;

  onEvent = (event: Event): void => {
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
    player.initialize();
    this.player = player;

    // Trick to wait for the player to be initialized
    // otherwise initial events might be missed
    await player.isPlaying();

    await fn().finally(() => {
      player.destroy();
      this.isFinished_ = true;
      this.player = undefined;
      this.eventListeners = {};
    });
  };

  callPlayer = async <T>(fn: (player: Player) => Promise<T>): Promise<T> => {
    return await fn(this.ensurePlayer());
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
    fn: (player: Player) => void,
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<E> => {
    return await this.expectEventCalling<E>(
      expectationConvertible,
      timeoutSeconds,
      () => fn(this.ensurePlayer())
    );
  };

  callPlayerAndExpectEvents = async (
    fn: (player: Player) => void,
    expectationsConvertible: MultipleEventsExpectation | EventType[],
    timeoutSeconds: number
  ): Promise<Event[]> => {
    return await this.expectEventsCalling(
      expectationsConvertible,
      timeoutSeconds,
      () => fn(this.ensurePlayer())
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
    const currentTime = await this.ensurePlayer().getCurrentTime();
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

  private ensurePlayer = (): Player => {
    if (this.player !== undefined) {
      if (this.player.isDestroyed) {
        throw new Error(
          'Player was destroyed. Did you forget to call "startPlayerTest" again?'
        );
      }
      return this.player;
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
    afterListenerAttached: () => void = () => {}
  ): Promise<T> => {
    let actualExpectation: SingleEventExpectation;
    if (expectationConvertible instanceof SingleEventExpectation) {
      actualExpectation = expectationConvertible;
    } else {
      actualExpectation = PlainEvent(expectationConvertible as EventType);
    }
    let resolve: (event: T) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const future = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const removeListener = this.addEventListener((event) => {
      if (actualExpectation.maybeFulfillExpectation(event)) {
        resolve(event as T);
      }
    });
    const timeoutHandle = setTimeout(() => {
      if (!actualExpectation.isFulfilled) {
        removeListener();
        reject(new Error(`Expectation was not met: ${actualExpectation}`));
      }
    }, timeoutSeconds * 1000);
    afterListenerAttached();
    return future.then((event) => {
      clearTimeout(timeoutHandle);
      removeListener();
      return event;
    });
  };

  private expectEventsCalling = async (
    expectationsConvertible: MultipleEventsExpectation | EventType[],
    timeoutSeconds: number,
    afterListenerAttached: () => void = () => {}
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
    let fulfilledExpectations = 0;
    const receivedEvents: Event[] = [];
    let resolve: (event: Event[]) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const future = new Promise<Event[]>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const removeListener = this.addEventListener((event) => {
      if (actualExpectation.isNextExpectationMet(event)) {
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
        removeListener();
        reject(new Error(`Expectation was not met: ${actualExpectation}`));
      }
    }, timeoutSeconds * 1000);
    afterListenerAttached();
    return future.then((events) => {
      clearTimeout(timeoutHandle);
      removeListener();
      return events;
    });
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
