import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function NowPlayingControl() {
  useTVGestures();

  const [isNowPlayingEnabled, setIsNowPlayingEnabled] = useState(true);

  const player = usePlayer({
    playbackConfig: {
      isBackgroundPlaybackEnabled: true,
    },
    mediaControlConfig: {
      isEnabled: true,
    },
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        type: SourceType.HLS,
        title: 'Big Buck Bunny (Mux test stream)',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback(
    async (event: Event) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      setIsNowPlayingEnabled(await player.nowPlaying.isEnabled());
    },
    [player]
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const toggleNowPlaying = useCallback(async () => {
    await player.nowPlaying.setEnabled(!isNowPlayingEnabled);
    setIsNowPlayingEnabled(await player.nowPlaying.isEnabled());
  }, [isNowPlayingEnabled, player]);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSourceLoaded={onEvent}
        onSeek={onEvent}
        onSeeked={onEvent}
        onStallStarted={onEvent}
        onStallEnded={onEvent}
      />
      <View style={styles.controls}>
        <Text style={styles.statusText}>
          Now Playing integration is{' '}
          {isNowPlayingEnabled ? 'ENABLED' : 'DISABLED'}
        </Text>
        <Text style={styles.hintText}>
          Background the app or open Control Center to check the Now Playing
          info.
        </Text>
        <Button
          title={
            isNowPlayingEnabled ? 'Disable Now Playing' : 'Enable Now Playing'
          }
          onPress={toggleNowPlaying}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  player: {
    flex: 1,
  },
  controls: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'black',
  },
  statusText: {
    color: 'white',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    color: 'lightgray',
    marginBottom: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});
