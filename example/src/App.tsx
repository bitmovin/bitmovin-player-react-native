import React from 'react';

import { StyleSheet, View } from 'react-native';
import { PlayerView } from 'player-react-native-bridge';

const playerConfig = {
  key: '496AB151-A9A2-45AE-A239-AF2650935D3B',
};

export default function App() {
  return (
    <View style={styles.container}>
      <PlayerView config={playerConfig} style={styles.box} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: '100%',
    height: '100%',
  },
});
