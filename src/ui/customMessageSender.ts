/** @internal */
export interface CustomMessageSender {
  sendMessage(message: string, data: string | undefined): void;
}
