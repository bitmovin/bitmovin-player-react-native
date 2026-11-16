/** Wait for both a triggering operation and its event within one deadline. */
export async function receiveEvent<Event>(
  subscribe: (
    listener: (event: Event) => void,
    reject: (error: Error) => void
  ) => Promise<{ remove(): void }>,
  trigger: () => void | Promise<void>,
  timeoutMs = 15000
): Promise<Event> {
  let subscription: { remove(): void } | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let finished = false;
  let listener: (event: Event) => void = () => {};
  let rejectEvent: (error: Error) => void = () => {};
  const received = new Promise<Event>((resolve, reject) => {
    listener = resolve;
    rejectEvent = reject;
  });
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error('Event or triggering operation timed out')),
      timeoutMs
    );
  });
  try {
    const operation = Promise.resolve()
      .then(() => subscribe(listener, rejectEvent))
      .then((registered) => {
        if (finished) {
          registered.remove();
          throw new Error('Event registration completed after the deadline');
        }
        subscription = registered;
        return trigger();
      });
    const [, event] = await Promise.race([
      Promise.all([operation, received]),
      deadline,
    ]);
    return event;
  } finally {
    finished = true;
    clearTimeout(timeout);
    subscription?.remove();
  }
}
