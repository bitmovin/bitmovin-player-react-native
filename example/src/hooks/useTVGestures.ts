import 'react-native/tvos-types.d';
import { useEffect } from 'react';
import { TVEventControl, Platform } from 'react-native';

function forwardTVGestures() {
  if (Platform.isTV) {
    TVEventControl.disableGestureHandlersCancelTouches();
  }
}

function cancelTVGestures() {
  if (Platform.isTV) {
    TVEventControl.enableGestureHandlersCancelTouches();
  }
}

/**
 * **AppleTV only*
 *
 * By default, tvOS gesture touches are internally captured by `react-native-tvos` and
 * not forwarded to any subview in the app's hierarchy. What causes a lot of issues with the
 * player controls, specially the system's default. Therefore, this hook disables
 * such behavior for TVs.
 *
 * @platform ios
 * @see https://github.com/react-native-tvos/react-native-tvos/pull/366
 */
export function useTVGestures() {
  useEffect(() => {
    forwardTVGestures();
    return () => {
      cancelTVGestures();
    };
  }, []);
}
