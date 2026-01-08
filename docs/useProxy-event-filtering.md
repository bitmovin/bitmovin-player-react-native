# useProxy native event filtering notes

## Why the JS filtering existed originally

- React Native synthetic events include a `nativeEvent.target` (view node handle).
- The original `useProxy` compared the incoming `target` with the current view
  ref to avoid cross-talk when multiple `PlayerView` instances are mounted.
- This helped multi-player setups where two players emit events at the same time
  and handlers should only fire for the associated view instance.

## Why it is being removed now

- In some cases `nativeEvent.target` is `undefined`, which causes the filter to
  drop events entirely.
- Native already scopes events per view in Android, and iOS should be aligned
  (detach old listeners on re-attach) so JS-side target filtering becomes
  redundant.

## Current native behavior notes

- Android attaches listeners per view and detaches them on swap/dispose.
- iOS attaches listeners per view but only detaches when `playerId` is `nil`.
  This can allow leaks if a view is re-attached to a different player.

## Alternatives to JS target filtering

- Include `playerId` in every native event payload and filter in JS by
  `player.nativeId`.
- Align iOS with Android by detaching old listeners when a different player is
  attached.
