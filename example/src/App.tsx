import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { Player, PlayerConfig, SourceConfig } from 'player-react-native-bridge';
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
  useEffect(() => {
    const player = playerRef.current;
    // initialize native player with license key
    player?.setup(playerConfig);
    // load stream
    player?.loadSource(sourceConfig);

    setInterval(() => {
      player?.currentTime().then((time) => {
        console.log('current time:', time);
      });
    }, 2000);

    // destroy player during unmount
    return () => player?.destroy();
  }, []);
  return (
    <View style={styles.container}>
      <Player ref={playerRef} style={styles.player} />
    </View>
  );
}
