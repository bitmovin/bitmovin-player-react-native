import { NativeModules } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import { CustomMessageHandler } from './custommessagehandler';
import { CustomMessageSender } from './custommessagesender';

const Uuid = NativeModules.UuidModule;
const CustomMessageHandlerModule = NativeModules.CustomMessageHandlerModule;

/**
 * Takes care of JS/Native communication for a CustomMessageHandler.
 */
export class CustomMessageHandlerBridge implements CustomMessageSender {
  readonly nativeId: string;
  private customMessageHandler?: CustomMessageHandler;
  private isDestroyed: boolean;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Uuid.generate();
    this.isDestroyed = false;
    BatchedBridge.registerCallableModule(
      `CustomMessageBridge-${this.nativeId}`,
      this
    );
    CustomMessageHandlerModule.registerHandler(this.nativeId);
  }

  setCustomMessageHandler(customMessageHandler: CustomMessageHandler) {
    this.customMessageHandler = customMessageHandler;
    this.customMessageHandler.customMessageSender = this;
  }

  /**
   * Destroys the native CustomMessageHandler
   */
  destroy() {
    if (!this.isDestroyed) {
      CustomMessageHandlerModule.destroy(this.nativeId);
      this.isDestroyed = true;
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI sends a synchronous message.
   * @internal
   */
  receivedSynchronousMessage(message: string, data: string | undefined): void {
    const result = this.customMessageHandler?.receivedSynchronousMessage(
      message,
      data
    );
    CustomMessageHandlerModule.onReceivedSynchronousMessageResult(
      this.nativeId,
      result
    );
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by native code, when the UI sends an asynchronous message.
   * @internal
   */
  receivedAsynchronousMessage(message: string, data: string | undefined): void {
    this.customMessageHandler?.receivedAsynchronousMessage(message, data);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Called by CustomMessageHandler, when sending a message to the UI.
   */
  sendMessage(message: string, data: string | undefined): void {
    CustomMessageHandlerModule.sendMessage(this.nativeId, message, data);
  }
}
