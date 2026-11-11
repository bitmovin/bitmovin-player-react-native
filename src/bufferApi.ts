import { NativeBuffer } from './modules/playerModule';
import type { Player } from './player';

/**
 * Represents different types of media.
 */
export enum MediaType {
  /**
   * Audio media type.
   */
  AUDIO = 'audio',
  /**
   * Video media type.
   */
  VIDEO = 'video',
}

/**
 * Represents different types of buffered data.
 */
export enum BufferType {
  /**
   * Represents the buffered data starting at the current playback time.
   */
  FORWARD_DURATION = 'forwardDuration',
  /**
   * Represents the buffered data up until the current playback time.
   */
  BACKWARD_DURATION = 'backwardDuration',
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
export class BufferApi extends NativeBuffer {
  // Retains configured JS callbacks while this native API handle is retained.
  declare private readonly owner: Player;

  /** @internal */
  constructor(owner: Player) {
    super(owner);
    this.owner = owner;
  }

  /**
   * Gets the {@link BufferLevel|buffer level} from the Player
   * @param type The {@link BufferType} to return the level for.
   * @returns a {@link BufferLevels} that contains {@link BufferLevel} values for audio and video.
   */
  getLevel: (type: BufferType) => Promise<BufferLevels> = super.getLevel.bind(
    this
  );

  /**
   * Sets the target buffer level for the chosen buffer {@link BufferType} across all {@link MediaType} options.
   *
   * @param type The {@link BufferType} to set the target level for. On iOS and tvOS, only {@link BufferType.FORWARD_DURATION} is supported.
   * @param value The value to set. On iOS and tvOS when passing `0`, the player will choose an appropriate forward buffer duration suitable for most use-cases. On Android setting to `0` will have no effect.
   */
  setTargetLevel: (type: BufferType, value: number) => Promise<void> =
    super.setTargetLevel.bind(this);
}
