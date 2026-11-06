import type { CustomMessageHandler } from './custommessagehandler';
import type { CustomMessageSender } from './custommessagesender';
import * as Crypto from 'expo-crypto';
import CustomMessageHandlerModule, {
  getNativeCustomMessage,
} from './customMessageHandlerModule';
import { getOrCreate, remove } from '../nativeInstanceRegistry';
import { createNativeCallback } from '../nativeCallbacks';

/** Takes care of JS/Native communication for a CustomMessageHandler. */
export class CustomMessageHandlerBridge implements CustomMessageSender {
  readonly nativeId: string;
  private customMessageHandler?: CustomMessageHandler;
  private isDestroyed = false;

  constructor(nativeId?: string) {
    this.nativeId = nativeId ?? Crypto.randomUUID();
    getOrCreate('customMessage', this.nativeId, () =>
      CustomMessageHandlerModule.create(
        createNativeCallback((operation, [message, data]) => {
          if (operation === 'synchronousMessage') {
            return this.customMessageHandler?.receivedSynchronousMessage(
              message,
              data ?? undefined
            );
          }
          if (operation === 'asynchronousMessage') {
            this.customMessageHandler?.receivedAsynchronousMessage(
              message,
              data ?? undefined
            );
          }
          return null;
        })
      )
    );
  }

  setCustomMessageHandler(customMessageHandler: CustomMessageHandler) {
    this.customMessageHandler = customMessageHandler;
    customMessageHandler.customMessageSender = this;
  }

  destroy() {
    if (!this.isDestroyed) {
      const native = getNativeCustomMessage(this.nativeId);
      if (native) {
        void native.destroy();
        remove('customMessage', this.nativeId, native);
      }
      this.isDestroyed = true;
    }
  }

  sendMessage(message: string, data: string | undefined): void {
    void getNativeCustomMessage(this.nativeId)?.sendMessage(message, data);
  }
}
