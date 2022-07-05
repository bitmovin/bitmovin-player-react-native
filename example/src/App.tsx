import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import {
  usePlayer,
  PlayerView,
  SourceType,
} from 'bitmovin-player-react-native';
import styles from './styles';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function App() {
  const player = usePlayer();

  useEffect(() => {
    player.load({
      url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
      type: SourceType.HLS,
      title: 'Art of Motion',
      poster:
        'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
    });
  }, [player]);

  const onReady = useCallback(
    (event) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      player.play();
    },
    [player]
  );

  const onSourceLoaded = useCallback(
    (event) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      player.getSource().then((source) => {
        prettyPrint('SOURCE', source);
      });
    },
    [player]
  );

  const onEvent = useCallback((event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSourceLoaded={onSourceLoaded}
      />
    </View>
  );
}
