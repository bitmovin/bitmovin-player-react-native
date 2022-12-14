import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  usePlayer,
  PlayerView,
  SourceType,
  CdnProvider,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

export default function BasicAds() {
  useTVGestures();

  const player = usePlayer({
    analyticsConfig: {
      key: '<ANALYTICS-KEY>', // `key` is the only required parameter.
      playerKey: '<BITMOVIN-PLAYER-KEY>',
      cdnProvider: CdnProvider.AKAMAI, // Check out `CdnProvider` for more options.
      customUserId: 'Custom user ID',
      randomizeUserId: false, // Default value is true.
      experimentName: 'Experiment name',
      videoId: 'MyVideoId',
      title: 'Art of Motion',
      isLive: false,
      ads: false, // Can be changed to `true` in case `advertisingConfig` is also present.
      path: '/examples/basic_analytics',
      customData1: 'Custom data field 1',
      customData2: 'Custom data field 2',
      customData3: 'Custom data field 3',
      customData4: 'Custom data field 4',
      customData5: 'Custom data field 5',
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

  return (
    <View style={styles.container}>
      <PlayerView style={styles.player} player={player} />
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
