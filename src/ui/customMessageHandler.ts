import { NativeCustomMessage } from './customMessageHandlerModule';
import { NativeConfigSerializer } from '../native/nativeConfigSerializer';

export interface CustomMessageHandlerProps {
  /**
   * A function that will be called when the Player UI sends a synchronous message to the integration.
   */
  onReceivedSynchronousMessage: (
    message: string,
    data: string | undefined
  ) => string | undefined;
  /**
   * A function that will be called when the Player UI sends an asynchronous message to the integration.
   */
  onReceivedAsynchronousMessage: (
    message: string,
    data: string | undefined
  ) => void;
}

const handlers = new WeakMap<CustomMessageHandler, CustomMessageHandlerProps>();
/**
 * Provides two-way communication between the Player UI and the integration.
 * @platform Android, iOS
 */
export class CustomMessageHandler extends NativeCustomMessage {
  constructor(options: CustomMessageHandlerProps) {
    const serializer = new NativeConfigSerializer();
    const config = serializer.serialize({
      synchronousMessage: (message: string, data: string | null) =>
        options.onReceivedSynchronousMessage(message, data ?? undefined),
      asynchronousMessage: (message: string, data: string | null) =>
        options.onReceivedAsynchronousMessage(message, data ?? undefined),
    });
    super(config, serializer.dispatcher.callback);
    serializer.dispatcher.retain(this);
    handlers.set(this, options);
  }
  /** Handles a synchronous message delivered by the Player UI. */
  receivedSynchronousMessage(
    message: string,
    data: string | undefined
  ): string | undefined {
    return handlers.get(this)!.onReceivedSynchronousMessage(message, data);
  }
  /** Handles an asynchronous message delivered by the Player UI. */
  receivedAsynchronousMessage(message: string, data: string | undefined): void {
    handlers.get(this)!.onReceivedAsynchronousMessage(message, data);
  }
  /** Sends a message to the Player UI. Resolution acknowledges native submission. */
  declare sendMessage: (message: string, data?: string) => Promise<void>;
}
