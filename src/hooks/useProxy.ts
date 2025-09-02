import { RefObject, useCallback } from 'react';
import { Event } from '../events';
import { findNodeHandle } from 'react-native';
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
export function useProxy(
  viewRef: RefObject<any>
): <E extends Event>(callback?: Callback<E>) => NativeCallback<E> {
  return useCallback(
    <E extends Event>(callback?: Callback<E>) =>
      (event: { nativeEvent: E }) => {
        const eventTargetNodeHandle: number = (event.nativeEvent as any).target;
        if (eventTargetNodeHandle !== findNodeHandle(viewRef.current)) {
          return;
        }
        const { target, ...eventWithoutTarget } = event.nativeEvent as any;
        const sanitized = normalizeNonFinite(eventWithoutTarget);
        callback?.(sanitized as E);
      },
    [viewRef]
  );
}
