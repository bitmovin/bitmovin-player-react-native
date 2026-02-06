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
  private playerA_: Player | undefined;
  private playerB_: Player | undefined;
  private isFinished_: boolean = false;
  private eventListeners: { [key: string]: (event: Event) => void } = {};
  private eventListenersByPlayer: {
    A: { [key: string]: (event: Event) => void };
    B: { [key: string]: (event: Event) => void };
  } = { A: {}, B: {} };
  private isPlayerInitialized: boolean = false;
  private isPlayerInitializedByPlayer: { A: boolean; B: boolean } = {
    A: false,
    B: false,
  };
  private viewMode_: 'single' | 'multi' = 'single';
  private isSwapped_: boolean = false;

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
    this.isPlayerInitialized = false;
    this.reRender();
  }

  get playerA(): Player | undefined {
    return this.playerA_;
  }

  get playerB(): Player | undefined {
    return this.playerB_;
  }

  private set players(players: { playerA?: Player; playerB?: Player }) {
    this.playerA_ = players.playerA;
    this.playerB_ = players.playerB;
    this.isPlayerInitializedByPlayer = { A: false, B: false };
    this.reRender();
  }

  get isFinished(): boolean {
    return this.isFinished_;
  }

  get viewMode(): 'single' | 'multi' {
    return this.viewMode_;
  }

  get isSwapped(): boolean {
    return this.isSwapped_;
  }

  onReRender: (() => void) | undefined;

  onEvent = (event: Event): void => {
    Object.entries(this.eventListeners).forEach(([_, listener]) =>
      listener(event)
    );
  };

  onEventFor = (playerKey: 'A' | 'B') => {
    return (event: Event): void => {
      Object.entries(this.eventListenersByPlayer[playerKey]).forEach(
        ([_, listener]) => listener(event)
      );
    };
  };

  startPlayerTest = async (
    config: PlayerConfig,
    fn: () => Promise<void>
  ): Promise<void> => {
    if (config.licenseKey === undefined) {
      config.licenseKey = PlayerTestWorld.defaultLicenseKey;
    }

    this.viewMode_ = 'single';
    this.isFinished_ = false;
    this.isSwapped_ = false;

    const player = new Player({
      nativeId: `player-${uuid.v4()}`,
      ...config,
    });
    player.initialize();
    this.player = player;

    await fn().finally(() => {
      player.destroy();
      this.isFinished_ = true;
      this.player = undefined;
      this.eventListeners = {};
    });
  };

  startMultiPlayerTest = async (
    configA: PlayerConfig,
    configB: PlayerConfig,
    fn: () => Promise<void>
  ): Promise<void> => {
    if (configA.licenseKey === undefined) {
      configA.licenseKey = PlayerTestWorld.defaultLicenseKey;
    }
    if (configB.licenseKey === undefined) {
      configB.licenseKey = PlayerTestWorld.defaultLicenseKey;
    }

    this.viewMode_ = 'multi';
    this.isFinished_ = false;
    this.isSwapped_ = false;
    this.eventListeners = {};
    this.eventListenersByPlayer = { A: {}, B: {} };

    const playerA = new Player({
      nativeId: `player-${uuid.v4()}`,
      ...configA,
    });
    const playerB = new Player({
      nativeId: `player-${uuid.v4()}`,
      ...configB,
    });
    playerA.initialize();
    playerB.initialize();
    this.players = { playerA, playerB };

    // Allow UI to render both PlayerViews before starting assertions.
    await new Promise((resolve) => setTimeout(resolve, 300));

    await fn().finally(() => {
      playerA.destroy();
      playerB.destroy();
      this.isFinished_ = true;
      this.viewMode_ = 'single';
      this.isSwapped_ = false;
      this.players = {};
      this.eventListenersByPlayer = { A: {}, B: {} };
    });
  };

  swapViews = async (): Promise<void> => {
    if (this.viewMode_ !== 'multi') {
      throw new Error('swapViews can only be used in multi-player mode.');
    }
    this.isSwapped_ = !this.isSwapped_;
    this.reRender();
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  callPlayer = async <T>(fn: (player: Player) => Promise<T>): Promise<T> => {
    return await fn(await this.ensurePlayer());
  };

  callPlayerFor = async <T>(
    playerKey: 'A' | 'B',
    fn: (player: Player) => Promise<T>
  ): Promise<T> => {
    return await fn(await this.ensurePlayerFor(playerKey));
  };

  expectEvent = async <T extends Event>(
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<T> => {
    return this.expectEventCalling(expectationConvertible, timeoutSeconds);
  };

  expectEventFor = async <T extends Event>(
    playerKey: 'A' | 'B',
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<T> => {
    return this.expectEventCallingFor(
      playerKey,
      expectationConvertible,
      timeoutSeconds
    );
  };

  expectEvents = async (
    expectationsConvertible: MultipleEventsExpectation | EventType[],
    timeoutSeconds: number
  ): Promise<Event[]> => {
    return this.expectEventsCalling(expectationsConvertible, timeoutSeconds);
  };

  expectNoEventFor = async (
    playerKey: 'A' | 'B',
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<void> => {
    return this.expectNoEventCallingFor(
      playerKey,
      expectationConvertible,
      timeoutSeconds
    );
  };

  callPlayerAndExpectEvent = async <E extends Event>(
    fn: (player: Player) => void,
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<E> => {
    return await this.expectEventCalling<E>(
      expectationConvertible,
      timeoutSeconds,
      async () => fn(await this.ensurePlayer())
    );
  };

  callPlayerAndExpectEventFor = async <E extends Event>(
    playerKey: 'A' | 'B',
    fn: (player: Player) => void,
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<E> => {
    return await this.expectEventCallingFor<E>(
      playerKey,
      expectationConvertible,
      timeoutSeconds,
      async () => fn(await this.ensurePlayerFor(playerKey))
    );
  };

  callPlayerAndExpectEventOnView = async <E extends Event>(
    viewKey: 'A' | 'B',
    playerKey: 'A' | 'B',
    fn: (player: Player) => void,
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<E> => {
    return await this.expectEventCallingFor<E>(
      viewKey,
      expectationConvertible,
      timeoutSeconds,
      async () => fn(await this.ensurePlayerFor(playerKey))
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
      async () => fn(await this.ensurePlayer())
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

  loadSourceConfigFor = async (
    playerKey: 'A' | 'B',
    sourceConfig: SourceConfig,
    timeoutSeconds: number = 10
  ): Promise<ReadyEvent> => {
    return await this.callPlayerAndExpectEventFor(
      playerKey,
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
    if (this.player !== undefined) {
      if (this.player.isDestroyed) {
        throw new Error(
          'Player was destroyed. Did you forget to call "startPlayerTest" again?'
        );
      }
      await this.ensurePlayerInitialized();
      return this.player;
    }
    throw new Error("It seems you forgot to call 'startPlayerTest' first.");
  };

  private ensurePlayerFor = async (playerKey: 'A' | 'B'): Promise<Player> => {
    const player = playerKey === 'A' ? this.playerA_ : this.playerB_;
    if (player !== undefined) {
      if (player.isDestroyed) {
        throw new Error(
          'Player was destroyed. Did you forget to call "startMultiPlayerTest" again?'
        );
      }
      await this.ensurePlayerInitializedFor(playerKey);
      return player;
    }
    throw new Error(
      "It seems you forgot to call 'startMultiPlayerTest' first."
    );
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
    await afterListenerAttached();
    return future.then((event) => {
      clearTimeout(timeoutHandle);
      removeListener();
      return event;
    });
  };

  private expectEventCallingFor = async <T extends Event>(
    playerKey: 'A' | 'B',
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
    let resolve: (event: T) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const future = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const removeListener = this.addEventListenerFor(playerKey, (event) => {
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
    await afterListenerAttached();
    return future.then((event) => {
      clearTimeout(timeoutHandle);
      removeListener();
      return event;
    });
  };

  private expectNoEventCallingFor = async (
    playerKey: 'A' | 'B',
    expectationConvertible: SingleEventExpectation | EventType,
    timeoutSeconds: number
  ): Promise<void> => {
    let actualExpectation: SingleEventExpectation;
    if (expectationConvertible instanceof SingleEventExpectation) {
      actualExpectation = expectationConvertible.copy();
    } else {
      actualExpectation = PlainEvent(expectationConvertible as EventType);
    }

    return new Promise<void>((resolve, reject) => {
      const removeListener = this.addEventListenerFor(playerKey, (event) => {
        if (actualExpectation.maybeFulfillExpectation(event)) {
          removeListener();
          reject(new Error(`Unexpected event received: ${actualExpectation}`));
        }
      });

      setTimeout(() => {
        removeListener();
        resolve();
      }, timeoutSeconds * 1000);
    });
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
    await afterListenerAttached();
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

  private addEventListenerFor = <T extends Event>(
    playerKey: 'A' | 'B',
    listener: (event: T) => void
  ): (() => void) => {
    const key = uuid.v4() as string;
    this.eventListenersByPlayer[playerKey][key] = async (event) =>
      listener(event as T);
    return () => {
      delete this.eventListenersByPlayer[playerKey][key];
    };
  };

  private ensurePlayerInitialized = async (): Promise<void> => {
    if (!this.isPlayerInitialized) {
      // Trick to make sure the player is initialized,
      // otherwise method calls might have no effect.
      await new Promise((resolve) => setTimeout(resolve, 150));
      this.isPlayerInitialized = true;
    }
  };

  private ensurePlayerInitializedFor = async (
    playerKey: 'A' | 'B'
  ): Promise<void> => {
    if (!this.isPlayerInitializedByPlayer[playerKey]) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      this.isPlayerInitializedByPlayer[playerKey] = true;
    }
  };
}
