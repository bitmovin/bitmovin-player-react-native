import React, { useState } from 'react';
import { useCavy, wrap } from 'cavy';
import { StyleSheet, Text } from 'react-native';
import { Event, PlayerView } from 'bitmovin-player-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
const darkTextColor = '#11181C';
const TestablePlayerView = wrap(PlayerView);

interface TestablePlayerProps {
  playerTestWorld: PlayerTestWorld;
}

export default function TestablePlayer({
  playerTestWorld,
}: TestablePlayerProps): React.JSX.Element {
  const generateTestHook = useCavy();
  const [renderCount, setRenderCount] = useState(0);
  const player = playerTestWorld.player;
  const onEvent = (event: Event) => {
    if (player && playerTestWorld.player === player) {
      if (
        /^(onAd|onNonLinearAd)/.test(event.name) ||
        [
          'onReady',
          'onPaused',
          'onStallStarted',
          'onStallEnded',
          'onPlayerError',
          'onSourceError',
        ].includes(event.name)
      ) {
        const detail = event as Event & {
          duration?: number;
          quartile?: string;
          code?: number;
        };
        console.info(
          '[Cavy event]',
          JSON.stringify({
            playerId: player.nativeId,
            event: event.name,
            observedAt: Date.now(),
            duration:
              typeof detail.duration === 'number' ? detail.duration : undefined,
            quartile:
              detail.quartile &&
              ['first', 'mid_point', 'third'].includes(detail.quartile)
                ? detail.quartile
                : undefined,
            code: typeof detail.code === 'number' ? detail.code : undefined,
          })
        );
      }
      playerTestWorld.onEvent(event);
    }
  };
  // The test world triggers re-renders through this callback, so it must be set during render.
  // eslint-disable-next-line react-hooks/immutability
  playerTestWorld.onReRender = () => setRenderCount((count) => count + 1);

  return (
    <SafeAreaView style={styles.container}>
      {(playerTestWorld.player && (
        <>
          <Text style={styles.text}>Tests are running...🧪</Text>
          <TestablePlayerView
            key={renderCount}
            ref={generateTestHook('PlayerView')}
            player={playerTestWorld.player}
            style={styles.player}
            onPlayerViewReady={() => {
              if (player && playerTestWorld.player === player) {
                playerTestWorld.onPlayerViewReady(player);
              }
            }}
            onEvent={(event: Event) => {
              // PlayerView in src/components/PlayerView/index.tsx attaches the
              // metadata handlers only when their props are set and enriches
              // their events with addPlatformToMetadataEvent. Ignore the raw
              // catch-all copies here to observe each metadata event once.
              if (
                event.name !== 'onMetadata' &&
                event.name !== 'onMetadataParsed'
              ) {
                onEvent(event);
              }
            }}
            onMetadata={onEvent}
            onMetadataParsed={onEvent}
          />
        </>
      )) || (
        <Text style={styles.text}>
          {playerTestWorld.isFinished
            ? 'Tests have finished!'
            : 'Waiting for tests to start...'}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  player: {
    flex: 0.7,
    backgroundColor: 'black',
  },
  text: {
    fontSize: 24,
    color: darkTextColor,
  },
});
