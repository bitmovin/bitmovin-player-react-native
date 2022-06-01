import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import {
  Player,
  PlayerConfig,
  SourceConfig,
} from '@bitmovin/player-react-native';
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
    // load stream source
    player?.loadSource(sourceConfig);

    setTimeout(() => {
      player?.play();
      player?.getVolume().then((volume) => {
        console.log('volume:', volume);
      });
      player?.getDuration().then((duration) => {
        console.log('duration:', duration);
      });
      player?.getCurrentTime().then((time) => {
        console.log('current time (default):', time);
      });
      player?.getCurrentTime('absolute').then((time) => {
        console.log('current time (absolute):', time);
      });
      player?.getCurrentTime('relative').then((time) => {
        console.log('current time (relative):', time);
      });
      player?.isDestroyed().then((isDestroyed) => {
        console.log('destroyed:', isDestroyed);
      });
      player?.isMuted().then((isMuted) => {
        console.log('muted:', isMuted);
      });
      player?.isPlaying().then((isPlaying) => {
        console.log('playing:', isPlaying);
      });
      player?.isLive().then((isLive) => {
        console.log('live:', isLive);
      });
      player?.isAirPlayActive().then((isAirPlayActive) => {
        console.log('active airplay:', isAirPlayActive);
      });
      player?.isAirPlayAvailable().then((isAirPlayAvailable) => {
        console.log('available airplay:', isAirPlayAvailable);
      });
    }, 1500);
  }, []);
  return (
    <View style={styles.container}>
      <Player config={playerConfig} ref={playerRef} style={styles.player} />
    </View>
  );
}
