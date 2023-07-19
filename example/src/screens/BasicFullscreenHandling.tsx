import React, { useCallback, useRef, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  AdSourceType,
  AudioSession,
  Event,
  FullscreenHandler,
  PlayerView,
  SourceType,
  usePlayer,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import { RootStackParamsList } from '../App';
import Orientation from 'react-native-orientation-locker';

type BasicFullscreenHandlingProps = NativeStackScreenProps<
  RootStackParamsList,
  'BasicFullscreenHandling'
>;

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

class SampleFullscreenHandler implements FullscreenHandler {
  isFullscreenActive: boolean = true;
  onFullscreen: (fullscreenMode: boolean) => void;

  constructor(
    isFullscreenActive: boolean,
    onFullscreen: (fullscreenMode: boolean) => void
  ) {
    this.isFullscreenActive = isFullscreenActive;
    this.onFullscreen = onFullscreen;
  }

  enterFullscreen(): void {
    this.onFullscreen(true);
    StatusBar.setHidden(true);
    this.isFullscreenActive = true;
    Orientation.lockToLandscape();
    console.log('enter fullscreen');
  }

  exitFullscreen(): void {
    this.onFullscreen(false);
    StatusBar.setHidden(false);
    this.isFullscreenActive = false;
    Orientation.unlockAllOrientations();
    console.log('exit fullscreen');
  }
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

export default function BasicFullscreenHandling({
  navigation,
}: BasicFullscreenHandlingProps) {
  useTVGestures();

  const player = usePlayer({
    playbackConfig: {
      isAutoplayEnabled: true,
    },
    advertisingConfig: advertisingConfig,
  });

  const [fullscreenMode, setFullscreenMode] = useState(false);
  const fullscreenHandler = useRef(
    new SampleFullscreenHandler(fullscreenMode, (isFullscreen: boolean) => {
      console.log('on fullscreen change');
      setFullscreenMode(isFullscreen);
      navigation.setOptions({ headerShown: !isFullscreen });
    })
  ).current;
  useFocusEffect(
    useCallback(() => {
      // iOS audio session must be set to `playback` first otherwise PiP mode won't work.
      //
      // Usually it's desireable to set the audio's category only once during your app's main component
      // initialization. This way you can guarantee that your app's audio category is properly
      // configured throughout the whole lifecycle of the application.
      AudioSession.setCategory('playback').catch((error) => {
        // Handle any native errors that might occur while setting the audio's category.
        console.log(
          "[BasicFullscreen] Failed to set app's audio category to `playback`:\n",
          error
        );
      });
      // Load desired source configuration
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
  useFocusEffect(
    useCallback(() => {
      fullscreenHandler.enterFullscreen();
      return () => {
        fullscreenHandler.exitFullscreen();
      };
    }, [fullscreenHandler])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={fullscreenMode ? styles.playerFullscreen : styles.player}
        fullscreenHandler={fullscreenHandler}
        onFullscreenEnter={onEvent}
        onFullscreenExit={onEvent}
        onFullscreenEnabled={onEvent}
        onFullscreenDisabled={onEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  player: {
    flex: 1,
    backgroundColor: 'black',
  },
  playerFullscreen: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'black',
  },
});
