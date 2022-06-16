import React, { useRef, useEffect, useCallback } from 'react';
import { Platform, View } from 'react-native';
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
  type: Platform.select({
    ios: 'hls',
    android: 'dash',
  }),
  url: Platform.select({
    ios: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
    android:
      'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
  }) as string,
  poster: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
};

export default function App() {
  const playerRef = useRef<Player>(null);

  const initPlayer = useCallback(async () => {
    const player = playerRef.current;
    player?.create(playerConfig);
    console.log('player initialized');
    player?.loadSource(sourceConfig);
    console.log('source loaded');
    setTimeout(() => {
      player?.play();
    }, 5000);
  }, []);

  const destroy = useCallback(() => {
    const player = playerRef.current;
    player?.destroy();
    console.log('player destroyed');
  }, []);

  useEffect(() => {
    initPlayer();
    return () => destroy();
  }, [initPlayer, destroy]);

  const onEvent = useCallback((event) => {
    console.log(`[${event.name}]`, JSON.stringify(event, null, 2));
  }, []);

  const onReady = useCallback(
    (event) => {
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
        style={styles.player}
        onReady={onReady}
        onPlayerError={onEvent}
        onPlayerWarning={onEvent}
        onDestroy={onEvent}
        onMuted={onEvent}
        onUnmuted={onEvent}
        onPaused={onEvent}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPlaybackFinished={onEvent}
        onSeek={onEvent}
        onSeeked={onEvent}
        onSourceLoad={onEvent}
        onSourceLoaded={onEvent}
        onSourceUnloaded={onEvent}
        onSourceError={onEvent}
        onSourceWarning={onEvent}
      />
    </View>
  );
}
