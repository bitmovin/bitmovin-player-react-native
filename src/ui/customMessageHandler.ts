import { SharedCustomMessageHandler } from './customMessageHandlerModule';

export interface CustomMessageHandlerProps {
  /**
   * A function that will be called when the Player UI sends a synchronous message through the native bridge.
   */
  onReceivedSynchronousMessage: (
    message: string,
    data: string | undefined
  ) => string | undefined;
  /**
   * A function that will be called when the Player UI sends an asynchronous message through the native bridge.
   */
  onReceivedAsynchronousMessage: (
    message: string,
    data: string | undefined
  ) => void;
}

/**
 * Provides two-way communication between the Player UI and the integration.
 */
export class CustomMessageHandler {
  /** @internal Native peer used by the view and runtime API adapters. */
  readonly native: SharedCustomMessageHandler;

  constructor(private readonly options: CustomMessageHandlerProps) {
    this.native = new SharedCustomMessageHandler(options);
  }
  /** Releases the configured message callbacks. */
  destroy = (): Promise<void> => this.native.destroy();

  /** Handles a synchronous message delivered by the Player UI. */
  receivedSynchronousMessage(
    message: string,
    data: string | undefined
  ): string | undefined {
    return this.options.onReceivedSynchronousMessage(message, data);
  }
  /** Handles an asynchronous message delivered by the Player UI. */
  receivedAsynchronousMessage(message: string, data: string | undefined): void {
    this.options.onReceivedAsynchronousMessage(message, data);
  }
  /** Sends a message to the Player UI. Resolution acknowledges native submission. */
  sendMessage = (message: string, data?: string): Promise<void> =>
    this.native.sendMessage(message, data);
}
