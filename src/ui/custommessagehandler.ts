import { CustomMessageSender } from './custommessagesender';

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

/**
 * Android and iOS only.
 * For Android it requires Player SDK version 3.39.0 or higher.
 *
 * Provides a two-way communication channel between the Player UI and the integration.
 */
export class CustomMessageHandler {
  private readonly onReceivedSynchronousMessage: (
    message: string,
    data: string | undefined
  ) => string | undefined;
  private readonly onReceivedAsynchronousMessage: (
    message: string,
    data: string | undefined
  ) => void;

  /** @internal */
  customMessageSender?: CustomMessageSender;

  /**
   * Android and iOS only.
   *
   * Creates a new `CustomMessageHandler` instance to handle two-way communication between the integation and the Player UI.
   *
   * @param options - Configuration options for the `CustomMessageHandler` instance.
   */
  constructor({
    onReceivedSynchronousMessage,
    onReceivedAsynchronousMessage,
  }: CustomMessageHandlerProps) {
    this.onReceivedSynchronousMessage = onReceivedSynchronousMessage;
    this.onReceivedAsynchronousMessage = onReceivedAsynchronousMessage;
  }

  receivedSynchronousMessage(
    message: string,
    data: string | undefined
  ): string | undefined {
    return this.onReceivedSynchronousMessage(message, data);
  }

  receivedAsynchronousMessage(message: string, data: string | undefined): void {
    this.onReceivedAsynchronousMessage(message, data);
  }

  /**
   * Android and iOS only.
   *
   * Sends a message to the Player UI.
   *
   * @param message - Identifier for the callback which should be called.
   * @param data - Payload for the callback.
   */
  sendMessage(message: string, data: string | undefined): void {
    this.customMessageSender?.sendMessage(message, data);
  }
}
