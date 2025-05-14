import React, { useCallback, useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AdSourceType,
  AdSkippedEvent,
  PlayerViewConfig,
  TweaksConfig,
  ForceReuseVideoCodecReason,
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
  schedule: [],
};

const remoteControlConfig = {
  isCastEnabled: false,
};

const playerViewConfig: PlayerViewConfig = {
  hideFirstFrame: true,
};

const tweaksConfig: TweaksConfig = {
  enableMainContentDecodingDuringAds: false,
  reuseAdsLoaderAcrossImaAds: true,
  forceReuseVideoCodecReasons: [
    ForceReuseVideoCodecReason.ColorInfoMismatch,
    ForceReuseVideoCodecReason.MaxInputSizeExceeded,
    ForceReuseVideoCodecReason.MaxResolutionExceeded,
  ],
  allowChunklessPreparationForHls: true,
  useDrmSessionForClearSources: true,
};

export default function BasicAds() {
  useTVGestures();
  const clickStartTime = useRef(0);

  const player = usePlayer({
    tweaksConfig,
    advertisingConfig,
    remoteControlConfig,
    playbackConfig: { isAutoplayEnabled: true },
  });

  useFocusEffect(
    useCallback(() => {
      clickStartTime.current = Date.now();
      console.log('player.load called at', clickStartTime.current);
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

  const onSourceLoaded = useCallback(
    (event: Event) => {
      onEvent(event);
      // Dynamically schedule a pre-roll ad
      player.scheduleAd({
        position: 'pre',
        sources: [
          {
            tag: adTags.vastSkippable,
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
      prettyPrint(
        `Ad started in - (ms)`,
        event.timestamp - clickStartTime.current
      );
    },
    [player, onEvent, clickStartTime]
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
        config={playerViewConfig}
        onAdBreakFinished={onEvent}
        onAdBreakStarted={onEvent}
        onAdClicked={onEvent}
        onAdError={onEvent}
        onAdFinished={onEvent}
        onAdManifestLoad={onEvent}
        onAdManifestLoaded={onEvent}
        onAdQuartile={onEvent}
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
