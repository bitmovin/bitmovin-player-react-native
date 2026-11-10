import type { CustomMessageHandler } from './customMessageHandler';
import type { CustomMessageSender } from './customMessageSender';
import CustomMessageHandlerModule, {
  type NativeCustomMessage,
} from './customMessageHandlerModule';
import { NativeCallbacks } from '../native/nativeCallbacks';

/** Takes care of JS/Native communication for a CustomMessageHandler. */
export class CustomMessageHandlerBridge implements CustomMessageSender {
  /** @internal */
  native?: NativeCustomMessage;
  private customMessageHandler?: CustomMessageHandler;

  constructor() {
    this.native = new NativeCallbacks((operation, [message, data]) => {
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
    }).create((callback) => CustomMessageHandlerModule.create(callback));
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
