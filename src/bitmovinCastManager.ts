import { Platform } from 'react-native';
import BitmovinCastManagerModule from './modules/BitmovinCastManagerModule';

/**
 * The options to be used for initializing `BitmovinCastManager`
 * @remarks Platform: Android, iOS
 */
export interface BitmovinCastManagerOptions {
  /**
   * ID of receiver application.
   * Using `null` value will result in using the default application ID
   */
  applicationId?: string | null;
  /**
   * A custom message namespace to be used for communication between sender and receiver.
   * Using `null` value will result in using the default message namespace
   */
  messageNamespace?: string | null;
}

/**
 * Singleton providing access to GoogleCast related features.
 * The `BitmovinCastManager` needs to be initialized by calling `BitmovinCastManager.initialize`
 * before `Player` creation to enable casting features.
 *
 * @remarks Platform: Android, iOS
 */
export const BitmovinCastManager = {
  /**
   * Returns whether the `BitmovinCastManager` is initialized.
   * @returns A promise that resolves with a boolean indicating whether the `BitmovinCastManager` is initialized
   */
  isInitialized: async (): Promise<boolean> => {
    if (Platform.OS === 'ios' && Platform.isTV) {
      return false;
    }
    return BitmovinCastManagerModule.isInitialized();
  },

  /**
   * Initialize `BitmovinCastManager` based on the provided `BitmovinCastManagerOptions`.
   * This method needs to be called before `Player` creation to enable casting features.
   * If no options are provided, the default options will be used.
   *
   * IMPORTANT: This should only be called when the Google Cast SDK is available in the application.
   *
   * @param options The options to be used for initializing `BitmovinCastManager`
   * @returns A promise that resolves when the `BitmovinCastManager` was initialized successfully
   */
  initialize: async (
    options: BitmovinCastManagerOptions | null = null
  ): Promise<void> => {
    if (Platform.OS === 'ios' && Platform.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.initializeCastManager(
      options || undefined
    );
  },

  /**
   * Must be called in every Android Activity to update the context to the current one.
   * Make sure to call this method on every Android Activity switch.
   *
   * @returns A promise that resolves when the context was updated successfully
   * @remarks Platform: Android
   */
  updateContext: async (): Promise<void> => {
    if (Platform.OS === 'ios') {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.updateContext?.() || Promise.resolve();
  },

  /**
   * Sends the given message to the cast receiver.
   *
   * @param message The message to be sent
   * @param messageNamespace The message namespace to be used, in case of null the default message namespace will be used
   * @returns A promise that resolves when the message was sent successfully
   */
  sendMessage: (message: string, messageNamespace: string | null = null) => {
    if (Platform.OS === 'ios' && Platform.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.sendMessage(
      message,
      messageNamespace || undefined
    );
  },
};
