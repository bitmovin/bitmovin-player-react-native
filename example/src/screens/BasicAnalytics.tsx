import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  usePlayer,
  PlayerView,
  SourceType,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function getAnalyticsKey(): string {
  const analyticsKey = process.env.EXPO_PUBLIC_BITMOVIN_ANALYTICS_LICENSE_KEY;

  if (!analyticsKey) {
    const fallbackKey = '<ANALYTICS-KEY>';
    console.warn(
      'Bitmovin Analytics license key is not set. Please add EXPO_PUBLIC_BITMOVIN_ANALYTICS_LICENSE_KEY to your .env file. Falling back to placeholder key.'
    );
    return fallbackKey;
  }

  return analyticsKey;
}

export default function BasicAnalytics() {
  useTVGestures();

  const player = usePlayer({
    analyticsConfig: {
      licenseKey: getAnalyticsKey(), // `licenseKey` is the only required parameter.
      randomizeUserId: false,
      adTrackingDisabled: true,
      defaultMetadata: {
        cdnProvider: 'akamai',
        customUserId: 'Custom user ID from React',
        experimentName: 'Experiment name',
        customData1: 'Custom data field 1',
        customData2: 'Custom data field 2',
        customData3: 'Custom data field 3',
        customData4: 'Custom data field 4',
        customData5: 'Custom data field 5',
      },
    },
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

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
        analyticsSourceMetadata: {
          videoId: 'MyVideoId',
          title: 'Art of Motion',
          isLive: false,
          path: '/examples/basic_analytics',
          customData1: 'Custom data field 1 from source',
          experimentName: 'Experiment Name Override',
        },
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
