import type { CustomMessageHandler } from './customMessageHandler';
import type { CustomMessageSender } from './customMessageSender';
import CustomMessageHandlerModule, {
  type NativeCustomMessage,
} from './customMessageHandlerModule';
import { NativeConfigSerializer } from '../native/nativeConfigSerializer';

/** Takes care of JS/Native communication for a CustomMessageHandler. */
export class CustomMessageHandlerBridge implements CustomMessageSender {
  /** @internal */
  native?: NativeCustomMessage;
  private customMessageHandler?: CustomMessageHandler;

  constructor() {
    const serializer = new NativeConfigSerializer();
    const config = serializer.serialize({
      synchronousMessage: (message: string, data: string | null) =>
        this.customMessageHandler?.receivedSynchronousMessage(
          message,
          data ?? undefined
        ),
      asynchronousMessage: (message: string, data: string | null) =>
        this.customMessageHandler?.receivedAsynchronousMessage(
          message,
          data ?? undefined
        ),
    });
    this.native = serializer.dispatcher.create((callback) =>
      CustomMessageHandlerModule.create(config, callback)
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
