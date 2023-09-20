import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  BitmovinCastManager,
} from 'bitmovin-player-react-native';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function Casting() {
  BitmovinCastManager.initialize();

  const player = usePlayer();

  useFocusEffect(
    useCallback(() => {
      player.load({
        url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
        type: SourceType.HLS,
        title: 'BipBop - Apple sample stream',
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

  return (
    <View style={styles.container}>
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
  player: {
    flex: 1,
  },
});
