import React from 'react';

import { StyleSheet, View } from 'react-native';
import { PlayerView, Config } from 'player-react-native-bridge';

const config: Config = {
  player: {
    licenseKey: '496AB151-A9A2-45AE-A239-AF2650935D3B',
  },
  source: {
    type: 'hls',
    url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    poster:
      'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
  },
};

export default function App() {
  return (
    <View style={styles.container}>
      <PlayerView config={config} style={styles.player} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  player: {
    width: '100%',
    height: '100%',
  },
});
