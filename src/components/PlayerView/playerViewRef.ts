import { ComponentRef } from 'react';
import { PictureInPictureAction } from './pictureInPictureConfig';
import { NativePlayerView } from './native';

export interface PlayerViewRef extends ComponentRef<typeof NativePlayerView> {
  /**
   * Update Picture in Picture actions that should be displayed on the Picture in Picture window.
   * See {@link PictureInPictureConfig.pictureInPictureActions} for more details
   *
   * @example
   * Sample usage:
   * ```ts
   * const playerViewRef = useRef<NativePlayerViewRef>(null);
   * ...
   * useEffect(() => {
   *   playerViewRef.current?.updatePictureInPictureActions(pictureInPictureActions);
   * }, [pictureInPictureActions]);
   * ...
   * return (<PlayerView
   *         viewRef={playerViewRef} />)
   * ```
   */
  updatePictureInPictureActions: (
    actions: PictureInPictureAction[]
  ) => Promise<void>;
}
