import React, { useState } from 'react';
import { useCavy, wrap } from 'cavy';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { PlayerView } from 'bitmovin-player-react-native';
import PlayerWorld from '../playertesting/PlayerWorld';
import { Colors } from 'react-native/Libraries/NewAppScreen';

interface TestablePlayerProps {
  playerWorld: PlayerWorld;
}

export default function TestablePlayer({
  playerWorld,
}: TestablePlayerProps): JSX.Element {
  const generateTestHook = useCavy();
  const [renderCount, setRenderCount] = useState(0);
  playerWorld.onReRender = () => setRenderCount((count) => count + 1);

  const TestablePlayerView = wrap(PlayerView);
  return (
    <SafeAreaView style={styles.container}>
      {(playerWorld.player && (
        <>
          <Text style={styles.text}>Tests are running...🧪</Text>
          <TestablePlayerView
            key={renderCount}
            ref={generateTestHook('PlayerView')}
            player={playerWorld.player}
            style={styles.player}
            onEvent={playerWorld.onEvent}
          />
        </>
      )) || (
        <Text style={styles.text}>
          {playerWorld.isFinished
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
