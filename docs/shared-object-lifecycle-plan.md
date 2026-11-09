# SharedObject compatibility decisions

- `nativeId` aliases remain a TS compatibility contract, so multiple public
  wrappers can reference one SDK object. Alias flags and configuration remain
  independent. Reusing an ID redirects compatibility lookup to its current
  registration; an existing SharedObject never changes its SDK object.
- Creation stays lazy to preserve configuration supplied before `initialize()`,
  including Source remote-control settings. The TS method awaits a factory that
  returns a fully constructed native owner; there is no native initializing state.
- Destruction keeps the SDK reference reachable while its TS wrapper is retained.
  Direct methods inherit SDK behavior after destruction. Source has no SDK destroy
  method; its public destroy method removes the alias and closes owned callbacks.
- A named backend retains configuration owners because it can outlive the TS
  wrapper that created them. Destroying through any alias closes those owners.
- Offline factories receive an event endpoint subscribed before SDK creation.
  The backend's JS `events` property keeps that endpoint reachable for aliases
  and queued events; native retention alone does not retain its JS emitter.
- Android offline release clears its resource reference exactly once because
  the SDK has no `isReleased` state. Release is serialized against GC cleanup.
- FairPlay renewal accepts plain `skdUri` metadata, while the SDK requires the
  original native request. Each source therefore retains its own request lookup;
  this is content state, not a binding identity registry.
