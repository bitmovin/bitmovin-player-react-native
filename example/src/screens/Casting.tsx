import React, { useCallback } from 'react';
import { View, StyleSheet, Platform, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  BitmovinCastManager,
  Source,
} from 'bitmovin-player-react-native';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function Casting() {
  BitmovinCastManager.initialize();

  if (Platform.OS === 'android') {
    // Must be called in every activity on Android
    BitmovinCastManager.updateContext();
  }

  const player = usePlayer();

  useFocusEffect(
    useCallback(() => {
      const source = new Source({
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

      // Configure playing DASH source on Chromecast, even when casting from iOS.
      source.remoteControl = {
        castSourceConfig: {
          url: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
          type: SourceType.DASH,
          title: 'Art of Motion',
        },
      };
      player.loadSource(source);
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

  return (
    <View style={styles.container}>
      <View style={styles.buttonBar}>
        <Button
          title={'Show Dialog'}
          onPress={() => BitmovinCastManager.showDialog()}
        />
        <Button
          title={'Disconnect'}
          onPress={() => BitmovinCastManager.disconnect()}
        />
      </View>
      <PlayerView
        player={player}
        style={styles.player}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSeek={onEvent}
        onSeeked={onEvent}
        onCastAvailable={onEvent}
        onCastPaused={onEvent}
        onCastPlaybackFinished={onEvent}
        onCastPlaying={onEvent}
        onCastStarted={onEvent}
        onCastStart={onEvent}
        onCastStopped={onEvent}
        onCastTimeUpdated={onEvent}
        onCastWaitingForDevice={onEvent}
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
  buttonBar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 8,
  },
  player: {
    flex: 1,
  },
});
