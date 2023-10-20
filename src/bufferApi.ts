import { NativeModules } from 'react-native';

const BufferModule = NativeModules.BufferModule;

/**
 * Represents different types of media.
 */
export enum MediaType {
  /**
   * Audio media type.
   */
  AUDIO = 0,
  /**
   * Video media type.
   */
  VIDEO = 1,
}

/**
 * Represents different types of buffered data.
 */
export enum BufferType {
  /**
   * Represents the buffered data starting at the current playback time.
   */
  FORWARD_DURATION = 0,
  /**
   * Represents the buffered data up until the current playback time.
   */
  BACKWARD_DURATION = 1,
}

/**
 * Holds different information about the buffer levels.
 */
export interface BufferLevel {
  /**
   * The amount of currently buffered data, e.g. audio or video buffer level.
   */
  level?: number;
  /**
   * The target buffer level the player tries to maintain.
   */
  targetLevel?: number;
  /**
   * The media type the buffer data applies to.
   */
  media?: MediaType;
  /**
   * The buffer type the buffer data applies to.
   */
  type?: BufferType;
}

/**
 * Collection of {@link BufferLevel} objects
 */
export interface BufferLevels {
  /**
   * {@link BufferLevel} for {@link MediaType.AUDIO}.
   */
  audio: BufferLevel;
  /**
   * {@link BufferLevel} for {@link MediaType.VIDEO}.
   */
  video: BufferLevel;
}

/**
 * Provides the means to configure buffer settings and to query the current buffer state.
 * Accessible through {@link Player.buffer}.
 */
export class BufferApi {
  /**
   * The native player id that this analytics api is attached to.
   */
  readonly nativeId: string;

  constructor(playerId: string) {
    this.nativeId = playerId;
  }

  /**
   * Gets the {@link BufferLevel|buffer level} from the Player
   * @param type The {@link BufferType} to return the level for.
   * @returns a {@link BufferLevels} that contains {@link BufferLevel} values for audio and video.
   */
  getLevel = async (type: BufferType): Promise<BufferLevels> => {
    return BufferModule.getLevel(this.nativeId, type);
  };

  /**
   * Sets the target buffer level for the chosen buffer {@link BufferType} across all {@link MediaType} options.
   *
   * @param type The type of the buffer to set the target level for. On iOS and tvOS, only {@link BufferType.FORWARD_DURATION} is supported.
   * @param value The value to set. On iOS and tvOS when passing `0`, the player will choose an appropriate forward buffer duration suitable for most use-cases. On Android setting to `0` will have no effect.
   */
  setTargetLevel = async (type: BufferType, value: number): Promise<void> => {
    return BufferModule.setTargetLevel(this.nativeId, type, value);
  };
}
