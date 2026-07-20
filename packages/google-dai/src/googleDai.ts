import * as Crypto from 'expo-crypto';
import type { Player } from 'bitmovin-player-react-native';
import GoogleDaiModule, {
  assertGoogleDaiModuleAvailable,
} from './modules/GoogleDaiModule';
import {
  type GoogleDaiSourceConfig,
  GoogleDaiSourceType,
} from './googleDaiSourceConfig';

export interface GoogleDai {
  load(sourceConfig: GoogleDaiSourceConfig): Promise<void>;
}

export interface GoogleDaiCapability {
  readonly googleDai: GoogleDai;
}

const googleDaiInstanceSymbol: unique symbol = Symbol(
  'BitmovinPlayerReactNativeGoogleDai.instance'
);

type GoogleDaiDecoratedPlayer = Player & {
  [googleDaiInstanceSymbol]?: NativeGoogleDai;
};

/**
 * Attaches a Google DAI capability to an existing Player instance.
 */
export function withGoogleDai<T extends Player>(
  player: T
): T & GoogleDaiCapability {
  const decoratedPlayer = assertPlayer(player) as T &
    GoogleDaiCapability &
    GoogleDaiDecoratedPlayer;
  const existingGoogleDai = decoratedPlayer[googleDaiInstanceSymbol];

  if (existingGoogleDai) {
    assertExistingGoogleDaiProperty(decoratedPlayer, existingGoogleDai);
    return decoratedPlayer;
  }

  if (findPropertyDescriptor(decoratedPlayer, 'googleDai')) {
    throw new Error(
      'Cannot attach Google DAI because the player already defines a googleDai property.'
    );
  }
  if (!Object.isExtensible(decoratedPlayer)) {
    throw new Error('Cannot attach Google DAI to a non-extensible player.');
  }

  assertGoogleDaiModuleAvailable();
  const googleDai = new NativeGoogleDai(decoratedPlayer);

  Object.defineProperty(decoratedPlayer, googleDaiInstanceSymbol, {
    value: googleDai,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  Object.defineProperty(decoratedPlayer, 'googleDai', {
    value: googleDai,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return decoratedPlayer;
}

/**
 * Native-backed Google IMA DAI implementation for an existing Bitmovin Player.
 */
class NativeGoogleDai implements GoogleDai {
  private readonly nativeId: string;
  private readonly player: Player;

  private isInitialized = false;
  private initializePromise?: Promise<void>;

  constructor(player: Player) {
    this.player = assertPlayer(player);
    this.nativeId = Crypto.randomUUID();
  }

  load = async (sourceConfig: GoogleDaiSourceConfig): Promise<void> => {
    const validatedConfig = validateSourceConfig(sourceConfig);
    await this.initializeNative();
    this.ensurePlayerInitialized();
    await GoogleDaiModule.load(this.nativeId, validatedConfig);
  };

  private initializeNative(): Promise<void> {
    try {
      this.ensurePlayerInitialized();
    } catch (error) {
      return Promise.reject(error);
    }
    if (this.isInitialized) {
      return Promise.resolve();
    }
    if (!this.initializePromise) {
      this.initializePromise = GoogleDaiModule.initialize(
        this.nativeId,
        this.player.nativeId
      )
        .then(async () => {
          try {
            this.ensurePlayerInitialized();
            this.isInitialized = true;
          } catch (error) {
            await GoogleDaiModule.destroy(this.nativeId).catch(() => undefined);
            throw error;
          }
        })
        .catch((error) => {
          this.initializePromise = undefined;
          throw error;
        });
    }
    return this.initializePromise;
  }

  private ensurePlayerInitialized() {
    if (this.player.isDestroyed) {
      throw new Error('GoogleDai requires a non-destroyed Player.');
    }
    if (!this.player.isInitialized) {
      throw new Error(
        'GoogleDai requires an initialized Player. Mount PlayerView or await player.initialize() before loading DAI.'
      );
    }
  }
}

function assertExistingGoogleDaiProperty(
  player: Player,
  googleDai: NativeGoogleDai
) {
  const descriptor = findPropertyDescriptor(player, 'googleDai');
  if (!descriptor || descriptor.value !== googleDai) {
    throw new Error(
      'Cannot attach Google DAI because the player already defines a conflicting googleDai property.'
    );
  }
}

function findPropertyDescriptor(
  value: object,
  propertyName: PropertyKey
): PropertyDescriptor | undefined {
  let target: object | null = value;
  while (target) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyName);
    if (descriptor) {
      return descriptor;
    }
    target = Object.getPrototypeOf(target);
  }
  return undefined;
}

function assertPlayer(player: Player): Player {
  const candidate = assertRecord(player, 'GoogleDai player');
  if (
    typeof candidate.nativeId !== 'string' ||
    candidate.nativeId.trim().length === 0
  ) {
    throw new Error(
      'GoogleDai player must expose a non-empty nativeId string.'
    );
  }
  if (typeof candidate.isInitialized !== 'boolean') {
    throw new Error('GoogleDai player must expose an isInitialized boolean.');
  }
  if (typeof candidate.isDestroyed !== 'boolean') {
    throw new Error('GoogleDai player must expose an isDestroyed boolean.');
  }
  return player;
}

function validateSourceConfig(
  sourceConfig: GoogleDaiSourceConfig
): GoogleDaiSourceConfig {
  const config = assertRecord(sourceConfig, 'GoogleDai source config');
  const kind = config.kind;
  if (kind !== 'live') {
    throw new Error(
      `Unsupported GoogleDai source config kind: ${String(kind)}`
    );
  }
  return {
    kind,
    assetKey: requireNonEmptyString(config.assetKey, 'assetKey'),
    type: requireSourceType(config.type),
    ...optionalString(config.apiKey, 'apiKey'),
    ...optionalString(config.networkCode, 'networkCode'),
    ...optionalAdTagParameters(config.adTagParameters),
  };
}

function assertRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`GoogleDai source config requires a non-empty ${field}.`);
  }
  return value;
}

function requireSourceType(value: unknown): GoogleDaiSourceType {
  if (value === GoogleDaiSourceType.DASH || value === GoogleDaiSourceType.HLS) {
    return value;
  }
  throw new Error('GoogleDai source config type must be either dash or hls.');
}

function optionalString<T extends 'apiKey' | 'networkCode'>(
  value: unknown,
  field: T
): Partial<Record<T, string>> {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'string') {
    throw new Error(`GoogleDai source config ${field} must be a string.`);
  }
  return { [field]: value } as Record<T, string>;
}

function optionalAdTagParameters(value: unknown): {
  adTagParameters?: Record<string, string>;
} {
  if (value == null) {
    return {};
  }
  const parameters = assertRecord(value, 'GoogleDai adTagParameters');
  const entries = Object.entries(parameters).map(([key, parameterValue]) => {
    if (typeof parameterValue !== 'string') {
      throw new Error(
        'GoogleDai adTagParameters keys and values must be strings.'
      );
    }
    return [key, parameterValue];
  });
  return { adTagParameters: Object.fromEntries(entries) };
}
