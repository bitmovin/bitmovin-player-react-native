# SharedObject compatibility decisions

- The Player and OfflineContentManager registries exist only for backward
  compatibility with `nativeId`-based construction: constructors with the same
  ID return the same public SharedObject, including its configuration and flags.
  The registries hold weak references to those objects. Keep the object reachable
  while using its ID; the registry does not keep it alive.
- Player, Source, and OfflineContentManager constructors create their native
  SharedObjects synchronously. The first SDK operation creates the SDK resource
  on the main thread and caches either its value or its failure. There is no
  separate JS initialization Promise or readiness flag. Source SDK listeners
  attach before the operation that loads the source; offline event subscriptions
  attach before the first SDK operation. Destruction removes the ID registration
  and releases an existing resource, or cancels an unused factory without creating
  one. Resource cleanup belongs to the owner.
- PlayerView passes imperative SharedObjects through its native view method after
  the host layout. They are not native JSX props, so Fabric does not recursively
  freeze the Player, its API handles, or the UI callback owners. SDK creation and
  view attachment complete before the method acknowledges public view readiness.
- Destruction keeps the SDK reference reachable while its TS wrapper is retained.
  Direct methods inherit SDK behavior after destruction. Source has no destruction
  API or binding ID; each wrapper owns one native Source directly.
- Each JS SharedObject owns its configuration dispatcher; native retains only a weak JS
  forwarding callback. A callback capturing its Source forms a collectible JS
  cycle. The canonical JS NativePlayer stores its loaded Source list and offline
  backend directly, including when used by aliases. Replacement, unload, and
  destruction release those references after native completion.
- Offline event listeners hold a weak manager reference. UI bridges own their
  dispatchers in JS and give native only weak forwarders, so abandoned renders
  do not leave a native-held callback rooting the bridge.
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
