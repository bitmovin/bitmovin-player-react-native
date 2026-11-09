# SharedObject compatibility decisions

- `nativeId` aliases remain a TS compatibility contract, so multiple public
  wrappers can reference one SDK object. Alias flags and configuration remain
  independent. Reusing an ID redirects compatibility lookup to its current
  registration; an existing SharedObject never changes its SDK object. The generic
  registry holds ready objects weakly, so keep an owning TS wrapper reachable
  while using its ID. Pending creation remains strongly retained until settlement.
- Player, Source, and OfflineContentManager constructors start one native creation
  attempt. Methods and `initialize()` await the same Promise; a failed attempt
  requires a new wrapper. Destruction removes the ID registration and waits for
  that object's creation before releasing it. The registry only resolves aliases;
  resource cleanup belongs to the owner.
- Destruction keeps the SDK reference reachable while its TS wrapper is retained.
  Direct methods inherit SDK behavior after destruction. Source has no destruction
  API; its compatibility ID remains associated while the object is reachable.
- Each JS SharedObject owns its configuration dispatcher; native retains only a weak JS
  forwarding callback. A callback capturing its Source forms a collectible JS
  cycle. The canonical JS Player retains its loaded Source/offline backend until
  replacement, unload, or destruction completes, including when used by aliases.
- Configuration callbacks share their consuming native object's scope. They
  have no independent SharedObject, lifecycle, or TS dependency list.
- Offline factories receive an event endpoint subscribed before SDK creation.
  The backend's JS `events` property keeps that endpoint reachable for aliases
  and queued events; native retention alone does not retain its JS emitter.
- Android offline cleanup runs once for explicit destruction and Expo collection:
  its SDK release is not idempotent. The SDK reference remains immutable.
- FairPlay renewal accepts plain `skdUri` metadata, while the SDK requires the
  original native request. Each source therefore retains its own request lookup;
  this is content state, not a binding identity registry.
