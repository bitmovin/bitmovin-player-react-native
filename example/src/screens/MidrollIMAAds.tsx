import { useFocusEffect } from '@react-navigation/native';
import {
  type Event,
  PlayerView,
  usePlayer,
} from 'bitmovin-player-react-native';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function BasicPlayback() {
  useTVGestures();

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      return () => {
        player.destroy();
      };
    }, [player])
  );
  const onAdContainerReady = useCallback(() => {
    player.loadDaiStream({
      assetId: 'c-rArva4ShKVIAkNfy6HUQ',
      fallbackUrl:
        'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
      adTagParams: {},
    });
  }, [player]);

  const onReady = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onAdContainerReady={onAdContainerReady}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSourceLoaded={onEvent}
        onSeek={onEvent}
        onSeeked={onEvent}
        onStallStarted={onEvent}
        onStallEnded={onEvent}
        onVideoPlaybackQualityChanged={onEvent}
        onAudioAdded={onEvent}
        onAudioChanged={onEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  player: {
    flex: 1,
  },
});
