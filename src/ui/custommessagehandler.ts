import { CustomMessageSender } from './custommessagesender';

/**
 * Handles the UI state change when fullscreen should be entered or exited.
 */
export class CustomMessageHandler {
  onReceivedSynchronousMessage: (
    message: string,
    data: string | undefined
  ) => string | undefined;
  onReceivedAsynchronousMessage: (
    message: string,
    data: string | undefined
  ) => void;

  customMessageSender?: CustomMessageSender;

  constructor(
    onReceivedSynchronousMessage: (
      message: string,
      data: string | undefined
    ) => string | undefined,
    onReceivedAsynchronousMessage: (
      message: string,
      data: string | undefined
    ) => void
  ) {
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

  sendMessage(message: string, data: string | undefined): void {
    this.customMessageSender?.sendMessage(message, data);
  }
}
