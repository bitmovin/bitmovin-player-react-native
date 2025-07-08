import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge';
import { CustomMessageHandler } from './custommessagehandler';
import { CustomMessageSender } from './custommessagesender';
import UuidExpoModule from '../modules/UuidExpoModule';
import CustomMessageHandlerExpoModule from './customMessageHandlerExpoModule';

/**
 * Takes care of JS/Native communication for a CustomMessageHandler.
 */
export class CustomMessageHandlerBridge implements CustomMessageSender {
  readonly nativeId: string;
  private customMessageHandler?: CustomMessageHandler;
  private isDestroyed: boolean;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? UuidExpoModule.generate();
    this.isDestroyed = false;
    BatchedBridge.registerCallableModule(
      `CustomMessageBridge-${this.nativeId}`,
      this
    );
    CustomMessageHandlerExpoModule.registerHandler(this.nativeId);
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
      CustomMessageHandlerExpoModule.destroy(this.nativeId);
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
    CustomMessageHandlerExpoModule.onReceivedSynchronousMessageResult(
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
    CustomMessageHandlerExpoModule.sendMessage(this.nativeId, message, data);
  }
}
