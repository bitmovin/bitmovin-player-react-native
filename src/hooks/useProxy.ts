import omit from 'lodash.omit';
import { useCallback, useRef, RefObject } from 'react';
import { NativeSyntheticEvent, findNodeHandle } from 'react-native';
import { Event } from '../events';

/**
 * Returns the actual event payload without RN's bubbling data.
 */
function unwrapNativeEvent<E extends Event>(event: NativeSyntheticEvent<E>): E {
  return omit(event.nativeEvent, ['target']) as E;
}

/**
 * Proxies a native event that receives a `NativeSyntheticEvent` using
 * a function that takes the `unwrapped` event version. Intented to be
 * used when proxying native events of a native React component.
 *
 * @param viewRef - Reference to native component instance.
 * @param proxy - Function that takes the `unwrapped` event.
 * @returns React callback that can be passed as a native event prop.
 */
export function useProxy<E extends Event>(
  viewRef: RefObject<any>,
  proxy?: (event: E) => void
): (nativeEvent: NativeSyntheticEvent<E>) => void {
  const proxyRef = useRef(proxy);
  return useCallback(
    (event) => {
      const node: number = (event.target as any)._nativeTag;
      if (node === findNodeHandle(viewRef.current)) {
        proxyRef.current?.(unwrapNativeEvent(event));
      }
    },
    [viewRef]
  );
}
