import React, { useState } from 'react';
import { useCavy, wrap } from 'cavy';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { PlayerView } from 'bitmovin-player-react-native';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { Colors } from 'react-native/Libraries/NewAppScreen';

interface TestablePlayerProps {
  playerTestWorld: PlayerTestWorld;
}

export default function TestablePlayer({
  playerTestWorld,
}: TestablePlayerProps): JSX.Element {
  const generateTestHook = useCavy();
  const [renderCount, setRenderCount] = useState(0);
  playerTestWorld.onReRender = () => setRenderCount((count) => count + 1);

  const TestablePlayerView = wrap(PlayerView);
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
    color: Colors.darker,
  },
});
