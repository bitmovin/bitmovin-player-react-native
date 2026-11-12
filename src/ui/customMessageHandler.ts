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

/**
 * Provides two-way communication between the Player UI and the integration.
 * @platform Android, iOS
 */
export class CustomMessageHandler {
  private readonly native: InternalCustomMessage;
  constructor(private readonly options: CustomMessageHandlerProps) {
    const serializer = new NativeConfigSerializer();
    const config = serializer.serialize({
      synchronousMessage: (message: string, data: string | null) =>
        options.onReceivedSynchronousMessage(message, data ?? undefined),
      asynchronousMessage: (message: string, data: string | null) =>
        options.onReceivedAsynchronousMessage(message, data ?? undefined),
    });
    this.native = new InternalCustomMessage(
      this,
      config,
      serializer.dispatcher.callback
    );
    serializer.dispatcher.retain(this);
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

/** @internal */
class InternalCustomMessage extends NativeCustomMessage {
  constructor(
    readonly handler: CustomMessageHandler,
    ...args: ConstructorParameters<typeof NativeCustomMessage>
  ) {
    super(...args);
  }
}

/** @internal */
export function getNativeCustomMessage(
  handler: CustomMessageHandler
): NativeCustomMessage {
  return handler['native'];
}
