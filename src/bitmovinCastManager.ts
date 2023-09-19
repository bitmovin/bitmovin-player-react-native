import { NativeModules, Platform } from 'react-native';

const BitmovinCastManagerModule = NativeModules.BitmovinCastManagerModule;

/**
 * The options to be used for initializing `BitmovinCastManager`
 * @platform Android, iOS
 */
export interface BitmovinCastManagerOptions {
  /**
   * ID of receiver application.
   * Using `nil` value will result in using the default application ID
   */
  applicationId?: string | null;
  /**
   * A custom message namespace to be used for communication between sender and receiver.
   * Using `nil` value will result in using the default message namespace
   */
  messageNamespace?: string | null;
}

/**
 * Singleton providing access to GoogleCast related features.
 * The `BitmovinCastManager` needs to be initialized by calling `BitmovinCastManager.initialize`
 * before `Player` creation to enable casting features.
 *
 * @platform Android, iOS
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
   * @param options The options to be used for initializing `BitmovinCastManager`
   * @returns A promise that resolves when the `BitmovinCastManager` was initialized successfully
   */
  initialize: async (
    options: BitmovinCastManagerOptions | null = null
  ): Promise<void> => {
    if (Platform.OS === 'ios' && Platform.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.initialize(options);
  },

  /**
   * Sends the given message to the cast receiver.
   *
   * @param message The message to be sent
   * @param messageNamespace The message namespace to be used, in case of null the default message namespace will be used
   * @returns A promise that resolves when the message was sent successfully
   */
  sendMessage: (message: String, messageNamespace: String | null = null) => {
    if (Platform.OS === 'ios' && Platform.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.sendMessage(message, messageNamespace);
  },

  /**
   * Sends the given metadata wrapped in a metadata message object to the cast receiver on the configured message namespace.
   * The provided metadata must be JSON serializable.
   * @param metadata The metadata to be sent
   * @returns A promise that resolves when the metadata was sent successfully
   */
  sendMetadata: (metadata: Record<string, any>) => {
    if (Platform.OS === 'ios' && Platform.isTV) {
      return Promise.resolve();
    }
    return BitmovinCastManagerModule.sendMetadata(metadata);
  },
};
