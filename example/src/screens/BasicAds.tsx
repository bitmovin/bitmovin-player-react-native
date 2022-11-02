import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AdSourceType,
  AdSkippedEvent,
  AdQuartileEvent,
  AdQuartile,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

const withCorrelator = (tag: string): string =>
  `${tag}${Math.floor(Math.random() * 100000)}`;

const adTags = {
  vastSkippable: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dskippablelinear&correlator='
  ),
  vast1: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator='
  ),
  vast2: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpostonly&cmsid=496&vid=short_onecue&correlator='
  ),
};

const advertisingConfig = {
  schedule: [
    // First ad item at "pre" (default) position.
    {
      sources: [
        {
          tag: adTags.vastSkippable,
          type: AdSourceType.IMA,
        },
      ],
    },
    // Second ad item at "20%" position.
    {
      position: '20%',
      sources: [
        {
          tag: adTags.vast1,
          type: AdSourceType.IMA,
        },
      ],
    },
  ],
};

export default function BasicAds() {
  useTVGestures();

  const player = usePlayer({ advertisingConfig });

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

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onSourceLoaded = useCallback(
    (event: Event) => {
      onEvent(event);
      // Dinamically schedule an ad to play after the video
      player.scheduleAd({
        position: 'post',
        sources: [
          {
            tag: adTags.vast2,
            type: AdSourceType.IMA,
          },
        ],
      });
    },
    [player, onEvent]
  );

  const onAdStarted = useCallback(
    (event: Event) => {
      onEvent(event);
      // Check if an ad is playing right now
      player.isAd().then((isAd) => {
        prettyPrint('is Ad playing?', isAd);
      });
    },
    [player, onEvent]
  );

  const onAdQuartile = useCallback(
    (event: AdQuartileEvent) => {
      onEvent(event);
      if (event.quartile === AdQuartile.MID_POINT) {
        // Tries to skip the ad when skippable and has reached its mid point.
        player.skipAd();
      }
    },
    [player, onEvent]
  );

  const onAdSkipped = useCallback(
    (event: AdSkippedEvent) => {
      onEvent(event);
      prettyPrint(`[${event.name}]`, `ID (${event.ad?.id})`);
    },
    [onEvent]
  );

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onAdBreakFinished={onEvent}
        onAdBreakStarted={onEvent}
        onAdClicked={onEvent}
        onAdError={onEvent}
        onAdFinished={onEvent}
        onAdManifestLoad={onEvent}
        onAdManifestLoaded={onEvent}
        onAdQuartile={onAdQuartile}
        onAdScheduled={onEvent}
        onAdSkipped={onAdSkipped}
        onAdStarted={onAdStarted}
        onSourceLoaded={onSourceLoaded}
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
