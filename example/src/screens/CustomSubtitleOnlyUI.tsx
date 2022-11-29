import React, { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  PlayerView,
  SourceType,
  usePlayer,
  UserInterfaceType,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

export default function SubtitlePlayback() {
  useTVGestures();

  const player = usePlayer({
    licenseKey: '',
    styleConfig: {
      userInterfaceType: UserInterfaceType.subtitle,
    },
  });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
            : 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        poster: 'https://bitmovin-a.akamaihd.net/content/sintel/poster.png',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  return (
    <View style={styles.container}>
      <PlayerView player={player} style={styles.player} />
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
