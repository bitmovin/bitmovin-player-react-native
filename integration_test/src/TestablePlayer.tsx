import React, { useState } from 'react';
import { useCavy, wrap } from 'cavy';
import { StyleSheet, Text } from 'react-native';
import { PlayerView } from 'bitmovin-player-react-native';
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
            onEvent={playerTestWorld.onEvent}
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
