import type { Event } from '../events';

// Temporary diagnostic branch: remove all PRN_LOAD_TRACE instrumentation after capture.
interface LoadTraceDetails {
  event?: Event;
  playerId?: string;
  sourceId?: string;
  currentPlayerId?: string;
  currentSourceId?: string;
  expectationId?: string;
  expected?: string[];
  pending?: string[];
  matched?: boolean;
  accepted?: boolean;
  listenerCount?: number;
}

const tracedEvents = [
  'onReady',
  'onSourceLoad',
  'onSourceLoaded',
  'onSourceUnloaded',
];

export function traceLoadEvent(stage: string, details: LoadTraceDetails): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const { event, expected } = details;
  if (event && !tracedEvents.includes(event.name)) return;
  if (expected && !expected.some((name) => tracedEvents.includes(name))) return;

  const source = (
    event as
      | (Event & {
          source?: {
            loadingState?: number;
            isActive?: boolean;
            isAttachedToPlayer?: boolean;
          };
        })
      | undefined
  )?.source;
  // Deliberately select primitives: never serialize config, URLs, metadata or errors.
  console.info(
    '[PRN_LOAD_TRACE]',
    JSON.stringify({
      runtime: 'js',
      stage,
      observedAt: Date.now(),
      monotonicMs:
        typeof performance !== 'undefined' ? performance.now() : undefined,
      playerId: details.playerId,
      sourceId: details.sourceId,
      currentPlayerId: details.currentPlayerId,
      currentSourceId: details.currentSourceId,
      event: event?.name,
      eventTimestamp: event?.timestamp,
      loadingState:
        typeof source?.loadingState === 'number'
          ? source.loadingState
          : undefined,
      isActive:
        typeof source?.isActive === 'boolean' ? source.isActive : undefined,
      isAttachedToPlayer:
        typeof source?.isAttachedToPlayer === 'boolean'
          ? source.isAttachedToPlayer
          : undefined,
      expectationId: details.expectationId,
      expected,
      pending: details.pending,
      matched: details.matched,
      accepted: details.accepted,
      listenerCount: details.listenerCount,
    })
  );
}
