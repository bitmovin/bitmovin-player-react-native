import type { NativeModule } from 'expo-modules-core';
import { requireNativeModule } from 'expo-modules-core';
import type { PictureInPictureAction } from '../components/PlayerView/pictureInPictureAction';

export type RNPlayerViewManagerModuleEvents = Record<string, any>;

/**
 * Functions of the player view manager that address the player view by the `nativeId` of the
 * player it shows, instead of the native view itself. Calls don't depend on the native view
 * being mounted yet, which avoids the races of view functions resolved via the view tag.
 */
declare class RNPlayerViewManagerModule extends NativeModule<RNPlayerViewManagerModuleEvents> {
  /**
   * Updates the Picture in Picture actions of the player view showing the player with `playerId`.
   * This is a function instead of a view prop because on Android, view props are not passed to the
   * native view while Picture in Picture is active.
   */
  updatePictureInPictureActions(
    playerId: string,
    actions: PictureInPictureAction[]
  ): Promise<void>;
  /**
   * Enables or disables Picture in Picture for the player view showing the player with `playerId`.
   */
  setIsPictureInPictureEnabled(
    playerId: string,
    isEnabled: boolean
  ): Promise<void>;
}

export default requireNativeModule<RNPlayerViewManagerModule>(
  'RNPlayerViewManager'
);
