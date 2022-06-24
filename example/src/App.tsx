import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import {
  usePlayer,
  PlayerView,
  SourceType,
} from 'bitmovin-player-react-native-sdk';
import styles from './styles';

export default function App() {
  const player = usePlayer({
    id: 'app-player',
    licenseKey: '496AB151-A9A2-45AE-A239-AF2650935D3B',
  });

  useEffect(() => {
    player.load({
      url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
      type: SourceType.HLS,
      poster:
        'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
    });
  }, [player]);

  const onPlayerActive = useCallback(
    (event) => {
      console.log('EVENT', JSON.stringify(event, null, 2));
      player.play();
    },
    [player]
  );

  const onSourceLoaded = useCallback(
    (event) => {
      console.log('EVENT', JSON.stringify(event, null, 2));
      player.getSource().then((source) => {
        console.log('SOURCE', JSON.stringify(source, null, 2));
      });
    },
    [player]
  );

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPlayerActive={onPlayerActive}
        onSourceLoaded={onSourceLoaded}
      />
    </View>
  );
}
