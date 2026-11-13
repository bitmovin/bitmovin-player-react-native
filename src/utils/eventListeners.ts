import type { Event } from '../events';

export const callListener = <T extends Event>(
  listener: (event: T) => void,
  event: T
) => {
  try {
    listener(event);
  } catch (error) {
    console.error(`Error in a listener for ${event.name}:`, error);
  }
};
