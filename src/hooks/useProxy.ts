import omit from 'lodash.omit';
import { useCallback, useRef } from 'react';
import { NativeSyntheticEvent } from 'react-native';
import { Event } from '../events';

function unwrapNativeEvent<E extends Event>(event: NativeSyntheticEvent<E>): E {
  return omit(event.nativeEvent, ['target']) as E;
}

export function useProxy<E extends Event>(
  proxy?: (event: E) => void
): (nativeEvent: NativeSyntheticEvent<E>) => void {
  const proxyRef = useRef(proxy);
  return useCallback((nativeEvent) => {
    proxyRef.current?.(unwrapNativeEvent(nativeEvent));
  }, []);
}
