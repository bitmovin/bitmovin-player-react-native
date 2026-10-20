import React, { useCallback, useState } from 'react';
import { View, Platform, StyleSheet, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AdItem,
  AdSourceType,
  AdvertisingConfig,
  NonLinearAdStartedEvent,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

const pauseAdItem: AdItem = {
  position: 'pause',
  sources: [
    {
      tag: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/nonlinear_ad_samples&sz=480x70&cust_params=sample_ct%3Dnonlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator=',
      type: AdSourceType.BITMOVIN,
    },
  ],
};

const advertisingConfig: AdvertisingConfig = {
  schedule: [pauseAdItem],
};

const remoteControlConfig = {
  isCastEnabled: false,
};

export default function PauseAds() {
  useTVGestures();

  const player = usePlayer({ advertisingConfig, remoteControlConfig });
  const [isPauseAdVisible, setIsPauseAdVisible] = useState(false);

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
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onNonLinearAdStarted = useCallback(
    (event: NonLinearAdStartedEvent) => {
      onEvent(event);
      setIsPauseAdVisible(true);
    },
    [onEvent]
  );

  const onNonLinearAdEnded = useCallback(
    (event: Event) => {
      onEvent(event);
      setIsPauseAdVisible(false);
    },
    [onEvent]
  );

  const skipPauseAd = useCallback(() => {
    player.skipAd();
  }, [player]);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onNonLinearAdStarted={onNonLinearAdStarted}
        onNonLinearAdSkipped={onNonLinearAdEnded}
        onNonLinearAdFinished={onNonLinearAdEnded}
        onAdClicked={onEvent}
        onAdError={onEvent}
        onPlayerWarning={onEvent}
      />
      <View style={styles.actionsContainer}>
        <Button
          title="Skip pause ad"
          onPress={skipPauseAd}
          disabled={!isPauseAdVisible}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  actionsContainer: {
    flex: 0,
    alignItems: 'center',
    borderTopColor: 'black',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  player: {
    flex: 1,
    backgroundColor: 'black',
  },
});
