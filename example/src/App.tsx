import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { View } from 'react-native';
import {
  Player,
  PlayerConfig,
  SourceConfig,
} from 'react-native-bitmovin-player';
import styles from './styles';

const playerConfig: PlayerConfig = {
  licenseKey: '496AB151-A9A2-45AE-A239-AF2650935D3B',
};

const sourceConfig: SourceConfig = {
  type: 'hls',
  url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
  poster: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
};

export default function App() {
  const playerRef = useRef<Player>(null);

  const initPlayer = useCallback(async () => {
    const player = playerRef.current;
    const source = await player?.getSource();
    if (!source) {
      player?.loadSource(sourceConfig);
    }
  }, []);

  useLayoutEffect(() => {
    initPlayer();
  }, [initPlayer]);

  const onEvent = useCallback((event) => {
    console.log(`[EVENT] ${event.name}`, JSON.stringify(event, null, 2));
  }, []);

  const onReady = useCallback(
    async (event) => {
      onEvent(event);
      const player = playerRef.current;
      player?.play();
    },
    [onEvent]
  );

  return (
    <View style={styles.container}>
      <Player
        ref={playerRef}
        config={playerConfig}
        style={styles.player}
        onEvent={onEvent}
        onPlay={onEvent}
        onReady={onReady}
      />
    </View>
  );
}
