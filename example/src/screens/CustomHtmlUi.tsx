import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  ReceivedAsynchronousMessage,
  ReceivedSynchronousMessage,
} from 'bitmovin-player-react-native';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function CustomHtmlUi() {
  const player = usePlayer({
    styleConfig: {
      playerUiCss:
        'https://cdn.statically.io/gh/bitmovin/bitmovin-player-ios-samples/main/CustomHtmlUi/Supporting%20Files/bitmovinplayer-ui.min.css',
      playerUiJs:
        'https://cdn.statically.io/gh/bitmovin/bitmovin-player-ios-samples/main/CustomHtmlUi/Supporting%20Files/bitmovinplayer-ui.min.js',
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
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onReceivedAsynchronousMessage = useCallback(
    (event: ReceivedAsynchronousMessage) => {
      prettyPrint(`MESSAGE [${event.message}]`, event);
    },
    []
  );

  const onReceivedSynchronousMessage = useCallback(
    (event: ReceivedSynchronousMessage) => {
      prettyPrint(`MESSAGE [${event.message}]`, event);
    },
    []
  );

  const onSourceLoaded = useCallback((event: Event) => {
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
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSourceLoaded={onSourceLoaded}
        onReceivedAsynchronousMessage={onReceivedAsynchronousMessage}
        onReceivedSynchronousMessage={onReceivedSynchronousMessage}
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
