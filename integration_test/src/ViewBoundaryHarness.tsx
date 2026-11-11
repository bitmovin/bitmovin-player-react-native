import React, { useLayoutEffect, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { PlayerView, type PlayerViewProps } from 'bitmovin-player-react-native';

type Selection = { props?: PlayerViewProps; onCommit?: () => void };
// Cavy replaces its child tree before invoking each test, without awaiting that commit.
// Preserve the pending request so the replacement harness can consume it.
let selection: Selection = {};
let update: (() => void) | undefined;
function select(next: Selection): void {
  selection = next;
  update?.();
}
function subscribe(listener: () => void): () => void {
  update = listener;
  return () => {
    if (update === listener) update = undefined;
  };
}
export async function showBoundaryView(props?: PlayerViewProps): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const ready = new Promise<void>((resolve, reject) => {
    timeout = setTimeout(
      () =>
        reject(
          new Error('PlayerView test harness did not acknowledge its update')
        ),
      15000
    );
    if (!props) {
      select({ onCommit: resolve });
      return;
    }
    select({
      props: {
        ...props,
        onPlayerViewReady: () => {
          props.onPlayerViewReady?.();
          resolve();
        },
      },
    });
  });
  try {
    await ready;
  } catch (error) {
    // Never retain a failed test's SDK owners in the pending remount request.
    select({});
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export default function ViewBoundaryHarness({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const current = useSyncExternalStore(subscribe, () => selection);
  useLayoutEffect(() => current.onCommit?.(), [current]);
  return (
    <View style={{ flex: 1 }}>
      {current.props ? (
        <PlayerView {...current.props} style={{ flex: 1 }} />
      ) : (
        children
      )}
    </View>
  );
}
