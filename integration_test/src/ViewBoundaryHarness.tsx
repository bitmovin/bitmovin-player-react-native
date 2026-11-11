import React, { useLayoutEffect, useState } from 'react';
import { View } from 'react-native';
import { PlayerView, type PlayerViewProps } from 'bitmovin-player-react-native';

type Selection = { props?: PlayerViewProps; onCommit?: () => void };
// Cavy replaces its child tree before invoking each test, without awaiting that commit.
// Preserve the pending request so the replacement harness can consume it.
let selection: Selection = {};
let update: ((next: Selection) => void) | undefined;
function select(next: Selection): void {
  selection = next;
  update?.(next);
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
  const [current, setSelection] = useState(() => selection);
  useLayoutEffect(() => current.onCommit?.(), [current]);
  useLayoutEffect(() => {
    update = setSelection;
    setSelection(selection);
    return () => {
      update = undefined;
    };
  }, []);
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
