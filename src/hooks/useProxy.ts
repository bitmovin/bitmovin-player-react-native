import omit from 'lodash.omit';
import { useCallback, useRef, RefObject } from 'react';
import { Platform, NativeSyntheticEvent, findNodeHandle } from 'react-native';
import { Event } from '../events';

function unwrapNativeEvent<E extends Event>(event: NativeSyntheticEvent<E>): E {
  return omit(event.nativeEvent, ['target']) as E;
}

export function useProxy<E extends Event>(
  viewRef: RefObject<any>,
  proxy?: (event: E) => void
): (nativeEvent: NativeSyntheticEvent<E>) => void {
  const proxyRef = useRef(proxy);
  return useCallback(
    (event) => {
      const target =
        Platform.OS === 'android'
          ? event.target
          : (event.nativeEvent as any).target;
      if (target === findNodeHandle(viewRef.current)) {
        proxyRef.current?.(unwrapNativeEvent(event));
      }
    },
    [viewRef]
  );
}
