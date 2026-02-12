import { useCallback } from 'react';
import { Event } from '../events';
import { normalizeNonFinite } from '../utils/normalizeNonFinite';

/**
 * A function that takes a generic event as argument.
 */
type Callback<E> = (event: E) => void;

/**
 * A function that takes the synthetic version of a generic event as argument.
 */
type NativeCallback<E> = (event: { nativeEvent: E }) => void;

/**
 * Create a proxy function that unwraps native events.
 */
export function useProxy(): <E extends Event>(
  callback?: Callback<E>
) => NativeCallback<E> {
  return useCallback(
    <E extends Event>(callback?: Callback<E>) =>
      (event: { nativeEvent: E }) => {
        // Remove the target field from the event as it's React Native internal metadata
        const { target: _target, ...eventWithoutTarget } = event.nativeEvent as any;
        const sanitized = normalizeNonFinite(eventWithoutTarget);
        callback?.(sanitized as E);
      },
    []
  );
}
