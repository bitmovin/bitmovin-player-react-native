import type { CustomMessageHandler } from './custommessagehandler';
import type { CustomMessageSender } from './custommessagesender';
import CustomMessageHandlerModule, {
  type NativeCustomMessage,
} from './customMessageHandlerModule';
import { createNativeCallback } from '../nativeCallbacks';

/** Takes care of JS/Native communication for a CustomMessageHandler. */
export class CustomMessageHandlerBridge implements CustomMessageSender {
  /** @internal */
  native?: NativeCustomMessage;
  private customMessageHandler?: CustomMessageHandler;

  constructor() {
    this.native = CustomMessageHandlerModule.create(
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
    );
  }

  setCustomMessageHandler(customMessageHandler: CustomMessageHandler) {
    this.customMessageHandler = customMessageHandler;
    customMessageHandler.customMessageSender = this;
  }

  destroy() {
    const native = this.native;
    this.native = undefined;
    void native?.destroy();
  }

  sendMessage(message: string, data: string | undefined): void {
    void this.native?.sendMessage(message, data);
  }
}
