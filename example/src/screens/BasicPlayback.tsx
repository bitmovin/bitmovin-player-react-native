import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
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

export default function BasicPlayback() {
  useTVGestures();

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
            : 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
        thumbnailTrack:
          'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/thumbnails/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.vtt',
        metadata: { platform: Platform.OS },
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onEvent = useCallback(
    async (event: Event) => {
      const videoQuality = await player.getVideoQuality();
      const availableVideoQualities = await player.getAvailableVideoQualities();
      console.log('### VideoQuality: ' + JSON.stringify(videoQuality));
      console.log(
        '### AvailableVideoQualities: ' +
          JSON.stringify(availableVideoQualities)
      );
      const pre =
        event.name === 'onVideoDownloadChangedEvent' ||
        event.name === 'onVideoPlaybackChangedEvent'
          ? '### '
          : '';

      prettyPrint(`${pre}EVENT [${event.name}]`, event);
    },
    [player]
  );

  const onAddedEvent = useCallback(async (event: Event) => {
    prettyPrint(`### EVENT [${event.name}]`, event);
  }, []);

  const onFixedEvent = useCallback(async (event: Event) => {
    if (Platform.OS === 'android') return;
    prettyPrint(`### EVENT [${event.name}]`, event);
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onReady={onReady}
        onPlay={onEvent}
        onVideoDownloadQualityChanged={onAddedEvent}
        onVideoPlaybackQualityChanged={onFixedEvent}
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
