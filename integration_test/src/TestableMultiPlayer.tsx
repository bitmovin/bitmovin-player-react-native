import React from 'react';
import { useCavy, wrap } from 'cavy';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { PlayerView } from 'bitmovin-player-react-native';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import { Colors } from 'react-native/Libraries/NewAppScreen';

interface TestableMultiPlayerProps {
  playerTestWorld: PlayerTestWorld;
  renderCount: number;
  isSwapped: boolean;
}

export default function TestableMultiPlayer({
  playerTestWorld,
  renderCount,
  isSwapped,
}: TestableMultiPlayerProps): React.JSX.Element {
  const generateTestHook = useCavy();

  const TestablePlayerView = wrap(PlayerView);
  const hasPlayers = playerTestWorld.playerA && playerTestWorld.playerB;
  const playerForViewA = isSwapped ? playerTestWorld.playerB : playerTestWorld.playerA;
  const playerForViewB = isSwapped ? playerTestWorld.playerA : playerTestWorld.playerB;

  return (
    <SafeAreaView style={styles.container}>
      {hasPlayers ? (
        <>
          <Text style={styles.text}>Multi-player tests are running...🧪</Text>
          <View style={styles.playersRow}>
            <View style={styles.playerContainer}>
              <TestablePlayerView
                key={`A-${renderCount}`}
                ref={generateTestHook('PlayerViewA')}
                player={playerForViewA}
                style={styles.player}
                onEvent={playerTestWorld.onEventFor('A')}
              />
            </View>
            <View style={styles.playerContainer}>
              <TestablePlayerView
                key={`B-${renderCount}`}
                ref={generateTestHook('PlayerViewB')}
                player={playerForViewB}
                style={styles.player}
                onEvent={playerTestWorld.onEventFor('B')}
              />
            </View>
          </View>
        </>
      ) : (
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
    alignItems: 'stretch',
    padding: 10,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  playerContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  player: {
    height: 180,
    width: '100%',
    backgroundColor: 'black',
  },
  text: {
    fontSize: 20,
    color: Colors.darker,
    marginBottom: 12,
  },
});
