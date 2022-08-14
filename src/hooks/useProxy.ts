import omit from 'lodash.omit';
import { useCallback, RefObject } from 'react';
import { NativeSyntheticEvent, findNodeHandle } from 'react-native';
import { Event } from '../events';

/**
 * A function that takes a generic event as argument.
 */
type Callback<E> = (event: E) => void;

/**
 * A function that takes the synthetic version of a generic event as argument.
 */
type NativeCallback<E> = (nativeEvent: NativeSyntheticEvent<E>) => void;

/**
 * Returns the actual event payload without RN's bubbling data.
 */
function unwrapNativeEvent<E extends Event>(event: NativeSyntheticEvent<E>): E {
  return omit(event.nativeEvent, ['target']) as E;
}

/**
 * Produce a callback function that takes some native synthetic event and calls
 * the passed callback with the unwrapped event value. And always check first
 * if the received synthetic event target matches viewRef's node value.
 */
export function useProxy(
  viewRef: RefObject<any>
): <E extends Event>(callback?: Callback<E>) => NativeCallback<E> {
  return useCallback(
    (callback) => (event) => {
      const node: number = (event.target as any)._nativeTag;
      if (node === findNodeHandle(viewRef.current)) {
        callback?.(unwrapNativeEvent(event));
      }
    },
    [viewRef]
  );
}
