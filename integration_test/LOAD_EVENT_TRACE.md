# Temporary load/unload event trace

This diagnostic branch records `[PRN_LOAD_TRACE]` JSON lines without changing
event payloads, timeouts, retries, fixtures or expectation ordering. Native
records require a Debug app; JS records require a development bundle. Remove
the instrumentation after the diagnostic capture; it is not a product fix.

Use the existing focused selection:

```sh
yarn integration-test test:ios --tags loading-vod,unloading
```

The VOD loading selection includes the native-view readiness case. Unloading
still starts after Ready, as in the failing test. Keep the original failing CI
revision/environment as the reference; a local simulator pass is supporting
evidence rather than a reproduction of CI host pressure.

Capture both the simulator app's native output and Metro's JS output. Native
logs do not appear in Metro. Keep first attempts and any existing automatic
retry records together; every player instance has its own `playerId`.

## Reading a capture

1. Find `js.command.load.request` and `js.command.load.submit`, then native
   `loadSource.entry` and `loadSource.resolved`. Registry lookup failures have
   their own rejected-stage records. Source creation maps the existing JS
   `sourceId` to `sourceObjectId`; the load binding supplies its player ID.
2. Match an event by its original `event` and `eventTimestamp`, using the
   source/player mapping and view identity to distinguish instances. Follow
   `source.callback` → `view.onEvent.beforeSerialization` →
   `view.onEvent.beforeDispatch` → `js.proxy.receive` →
   `js.proxy.normalized` → `js.test.receive` → `js.world.receive` →
   `js.expectation.event`.
3. At `js.test.receive`, `accepted: false` means the existing stale-player
   guard discarded the callback. It is logged before that guard. At the
   expectation boundary, use `expectationId`, `matched` and `pending`; timeout
   records retain the unfulfilled names. Attach/trigger records preserve
   listener-before-trigger observation.

`currentSourceId` describes the JS player's selected source, not a source ID
carried by the SDK event. Resolve actual native source identity from source
callback/view records. For Ready, native source state is sampled from the
callback player's current source because Ready has no source reference.

`observedAt` is epoch milliseconds in both runtimes. `monotonicMs` is local to
its runtime; do not subtract native and JS monotonic values. `eventTimestamp`
is preserved without unit conversion and is the cross-boundary matching key.
The proxy may also receive a typed callback copy of an event, so repeated proxy
records alone do not prove duplicate catch-all delivery. The test/world stages
show which copies actually reach expectations.

Only IDs, event names/timestamps, primitive source state and expectation
decisions are logged. URLs, configuration, metadata and error messages are
excluded. Registry teardown records are not proof of SDK deallocation. A
source callback without a view callback narrows the missing boundary but does
not prove why forwarding failed; no source callback also needs investigation
of command delivery and source lifecycle. Logging itself can change race
timing, so a passing instrumented run does not establish a fix.
