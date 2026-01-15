import React, { useCallback, useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  TimeChangedEvent,
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
    playbackConfig: {
      isAutoplayEnabled: true,
    },
  });

  const hasSwitchedSource = useRef(false);

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
            : 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/poster.jpg',
        thumbnailTrack:
          'https://cdn.bitmovin.com/content/internal/assets/art-of-motion-dash-hls-progressive/thumbnails/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.vtt',
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

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onTimeChanged = useCallback(
    (event: TimeChangedEvent) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      if (hasSwitchedSource.current) {
        return;
      }

      if (event.currentTime >= 10) {
        hasSwitchedSource.current = true;
        player.load({
          url: 'https://stream.streambase.ch/argovia/mp3-192/chmedia-oneplus-tv/op-2682513',
          type: SourceType.PROGRESSIVE,
          title: 'Argovia Radio',
        });
      }
    },
    [player]
  );

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
        onVideoPlaybackQualityChanged={onEvent}
        onAudioAdded={onEvent}
        onAudioChanged={onEvent}
        onTimeChanged={onTimeChanged}
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
