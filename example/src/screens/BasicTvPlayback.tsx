import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  PlayerViewConfig,
  TvUi,
  AdSourceType,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function BasicTvPlayback() {
  useTVGestures();

  const player = usePlayer({
    nativeId: 'my-player',
  });

  const config: PlayerViewConfig = {
    uiConfig: {
      // This is only applied for Android TVs, as on TvOS only the system UI is supported.
      variant: new TvUi(),
    },
  };

  const wmToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjIsImlzcyI6IlZSIiwiZXhwIjoxNzQ5ODU2ODQ0LCJ3bXZlciI6Mywid21pZGZtdCI6ImFzY2lpIiwid21pZHR5cCI6MSwid21rZXl2ZXIiOjMsIndtdG1pZHZlciI6NCwid21pZGxlbiI6NTEyLCJ3bW9waWQiOjMyLCJ3bWlkIjoiNTdiY2ZlODgtM2VmNC00N2FiLWFiYTktYmNmZGVkZGU3OTczIn0.ulJyt1AO1mubxTj23aRXMHHdUK1OaEylUSAixHW6yiM';
  const drmToken =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImtpZCI6Ijg2MWFhZGE1LTc1YzctNGJkMi04YTBmLTcyYWZmMzdkZTg4OCJ9.eyJpc3MiOiJ2ZWFyY2hKV1QiLCJzdWIiOiJiaXRtb3ZpbiIsImh0dHA6Ly9pcmRldG8uY29tL2NvbnRyb2wvYWlkIjoiYXN0cm8iLCJqdGkiOiJmZDIyYzc1OC02MmQ2LTQyNWUtOGE2Yy04N2ZlODM2MDgzMWUiLCJpYXQiOjE3MzA3MjAyNjYsImV4cCI6MTc2NjcyMDI2NiwiaHR0cDovL2lyZGV0by5jb20vY29udHJvbC9lbnQiOlt7ImVwaWQiOiJpcmRldG8tdGVzdC1lbnRpdGxlbWVudCIsImJpZCI6InZvZCJ9XSwiaXNlIjp0cnVlfQ.EurkMhiK8eAn19OhEKSjd2y9gkTMlP4Xds3yvPQ5f1A';

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
            : // : 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
              'https://vodc.dp.sooka.my/wmt:' +
              wmToken +
              '/4dcedab14f7a335f089a92ca9a05cd0f-a0ed04ae76afad077444-2/4dcedab14f7a335f089a92ca9a05cd0f-a0ed04ae76afad077444-2/index.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
        thumbnailTrack:
          'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/thumbnails/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.vtt',
        metadata: { platform: Platform.OS },
        drmConfig: {
          widevine: {
            licenseUrl:
              'https://license.ctrp.astro.com.my/licenseServer/widevine/v1/astro/license?contentId=4dcedab14f7a335f089a92ca9a05cd0f-a0ed04ae76afad077444-2',
            httpHeaders: {
              Authorization: 'Bearer ' + drmToken,
            },
          },
        },
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

  const onSourceLoaded = useCallback(
    (event: Event) => {
      onEvent(event);
      // Dinamically schedule an ad to play after the video
      player.scheduleAd({
        sources: [
          {
            tag: 'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpost&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator=',
            type: AdSourceType.IMA,
          },
        ],
      });
    },
    [player, onEvent]
  );

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        config={config}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSourceLoaded={onSourceLoaded}
        onSeek={onEvent}
        onSeeked={onEvent}
        onStallStarted={onEvent}
        onStallEnded={onEvent}
        onVideoPlaybackQualityChanged={onEvent}
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
