import { EventSubscription } from 'expo-modules-core';
import { CustomMessageHandler } from './custommessagehandler';
import { CustomMessageSender } from './custommessagesender';
import * as Crypto from 'expo-crypto';
import CustomMessageHandlerModule from './customMessageHandlerModule';

/**
 * Takes care of JS/Native communication for a CustomMessageHandler.
 */
export class CustomMessageHandlerBridge implements CustomMessageSender {
  readonly nativeId: string;
  private customMessageHandler?: CustomMessageHandler;
  private isDestroyed: boolean;

  private onReceivedSynchronousMessageSubscription?: EventSubscription;
  private onReceivedAsynchronousMessageSubscription?: EventSubscription;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Crypto.randomUUID();
    this.isDestroyed = false;

    // Set up event listeners for synchronous and asynchronous messages
    this.onReceivedSynchronousMessageSubscription =
      CustomMessageHandlerModule.addListener(
        'onReceivedSynchronousMessage',
        ({ nativeId, id, message, data }) => {
          if (nativeId !== this.nativeId) {
            return;
          }
          this.receivedSynchronousMessage(id, message, data);
        }
      );

    this.onReceivedAsynchronousMessageSubscription =
      CustomMessageHandlerModule.addListener(
        'onReceivedAsynchronousMessage',
        ({ nativeId, message, data }) => {
          if (nativeId !== this.nativeId) {
            return;
          }
          this.receivedAsynchronousMessage(message, data);
        }
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
      this.onReceivedSynchronousMessageSubscription?.remove();
      this.onReceivedAsynchronousMessageSubscription?.remove();
      this.onReceivedSynchronousMessageSubscription = undefined;
      this.onReceivedAsynchronousMessageSubscription = undefined;
      this.isDestroyed = true;
    }
  }

  /**
   * Called by native code, when the UI sends a synchronous message.
   * @internal
   */
  private receivedSynchronousMessage(
    id: number,
    message: string,
    data: string | undefined
  ): void {
    const result = this.customMessageHandler?.receivedSynchronousMessage(
      message,
      data
    );
    CustomMessageHandlerModule.onReceivedSynchronousMessageResult(id, result);
  }

  /**
   * Called by native code, when the UI sends an asynchronous message.
   * @internal
   */
  private receivedAsynchronousMessage(
    message: string,
    data: string | undefined
  ): void {
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
