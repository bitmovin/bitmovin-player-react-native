/**
 * A basic event.
 * @public
 */
export interface BasicEvent {
  type: string;
  target: number;
}

/**
 * An event.
 * @public
 */
export interface Event extends BasicEvent {
  name: string;
  timestamp: string;
}

/**
 * A play event.
 * @public
 */
export interface PlayEvent extends Event {
  time: string;
}
