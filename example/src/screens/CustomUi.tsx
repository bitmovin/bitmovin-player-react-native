import React, { useCallback, useState } from 'react';
import {
  View,
  Platform,
  StyleSheet,
  Dimensions,
  HWEvent,
  TouchableOpacity,
  useTVEventHandler,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PlayerControls } from '../components/PlayerControls';
import { ProgressBar } from '../components/ProgressBar';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AdSourceType,
  AdSkippedEvent,
} from 'bitmovin-player-react-native';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

interface State {
  play: boolean;
  currentTime: number;
  duration: number;
  showControls: boolean;
  isAd: boolean;
}

export default function CustomUi() {
  const myTVEventHandler = (evt: HWEvent) => {
    if (!state.showControls) {
      if (
        evt &&
        (evt.eventType === 'right' ||
          evt.eventType === 'left' ||
          evt.eventType === 'up' ||
          evt.eventType === 'down' ||
          evt.eventType === 'select')
      ) {
        showControls();
      }
    }
  };
  useTVEventHandler(myTVEventHandler);

  const [state, setState] = useState<State>({
    play: true, //because we have autoplay
    currentTime: 0,
    duration: 0,
    showControls: false,
    isAd: false,
  });

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

  const player = usePlayer({
    licenseKey: '21531108-4c7f-4b73-bab9-9dadf43302b5',
    remoteControlConfig: {
      isCastEnabled: false,
    },
    playbackConfig: {
      isAutoplayEnabled: true,
      isMuted: true,
    },
    styleConfig: {
      isUiEnabled: false,
    },
    advertisingConfig,
  });

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (state.showControls) {
          setState((s) => ({ ...s, showControls: false }));
          return true;
        } else {
          return false;
        }
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [state])
  );

  useFocusEffect(
    useCallback(() => {
      if (!player.config?.licenseKey || player.config?.licenseKey === '') {
        console.error('Bitmovin License Key is NOT specified');
      } else {
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
      }
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onPlayEvent = useCallback(
    (event: Event) => {
      setState({ ...state, play: true });

      onEvent(event);
    },
    [state, onEvent]
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

  const onAdBreakStarted = useCallback(
    (event: Event) => {
      onEvent(event);
      setState((s) => ({ ...s, isAd: true, showControls: false }));
    },
    [onEvent]
  );

  const onAdBreakFinished = useCallback(
    (event: Event) => {
      onEvent(event);
      setState((s) => ({ ...s, isAd: false }));
    },
    [onEvent]
  );

  const onAdSkipped = useCallback(
    (event: AdSkippedEvent) => {
      onEvent(event);
      prettyPrint(`[${event.name}]`, `ID (${event.ad?.id})`);
    },
    [onEvent]
  );

  function handlePlayPause() {
    // If playing, pause and show controls immediately.
    if (state.play) {
      player.pause();
      setState({ ...state, play: false });
    } else {
      player.play();
      setState({ ...state, play: true });
    }
  }

  function skipBackward() {
    player.seek(state.currentTime - 15);
    setState({ ...state, currentTime: state.currentTime - 15 });
  }

  function skipForward() {
    player.seek(state.currentTime + 15);
    setState({ ...state, currentTime: state.currentTime + 15 });
  }

  function onSeek(seekTime: number) {
    player.seek(seekTime);
  }

  function showControls() {
    if (state.isAd) {
      if (!state.play) {
        player.play();
        setState({ ...state, play: true });
      } else {
        player.pause();
        setState({ ...state, play: false });
      }
    } else {
      setState({ ...state, showControls: true });
    }
  }

  function onReady() {
    player.getDuration().then((time) => {
      setState({ ...state, duration: time });
    });
  }

  function onTimeChanged() {
    if (state.showControls) {
      player.getCurrentTime().then((time) => {
        setState({ ...state, currentTime: time });
      });
    }
  }

  return (
    <View>
      <PlayerView
        style={styles.video}
        player={player}
        onReady={onReady}
        onTimeChanged={onTimeChanged}
        onSourceError={onEvent}
        onPlay={onEvent}
        onPlaying={onPlayEvent}
        onPaused={onEvent}
        onSourceLoaded={onEvent}
        onSeek={onEvent}
        onSeeked={onEvent}
        onStallStarted={onEvent}
        onStallEnded={onEvent}
        onVideoPlaybackQualityChanged={onEvent}
        onAdBreakFinished={onAdBreakFinished}
        onAdBreakStarted={onAdBreakStarted}
        onAdClicked={onEvent}
        onAdError={onEvent}
        onAdFinished={onEvent}
        onAdManifestLoad={onEvent}
        onAdManifestLoaded={onEvent}
        onAdQuartile={onEvent}
        onAdScheduled={onEvent}
        onAdSkipped={onAdSkipped}
        onAdStarted={onAdStarted}
      />
      {state.showControls ? (
        <View style={styles.controlOverlay}>
          <PlayerControls
            onPlay={handlePlayPause}
            onPause={handlePlayPause}
            playing={state.play}
            skipBackwards={skipBackward}
            skipForwards={skipForward}
            showSkip={true}
          />
          <ProgressBar
            currentTime={state.currentTime}
            duration={state.duration}
            onSlideStart={handlePlayPause}
            onSlideComplete={handlePlayPause}
            onSlideCapture={onSeek}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.touchableOverlay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebebeb',
  },
  video: {
    height: Dimensions.get('window').width * (9 / 16),
    width: Dimensions.get('window').width,
    backgroundColor: 'black',
  },
  fullscreenVideo: {
    height: Dimensions.get('window').width,
    width: Dimensions.get('window').height,
    backgroundColor: 'black',
  },
  text: {
    marginTop: 30,
    marginHorizontal: 20,
    fontSize: 15,
    textAlign: 'justify',
  },
  fullscreenButton: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    paddingRight: 10,
  },
  controlOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000c4',
    justifyContent: 'space-between',
  },
  touchableOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0,
    justifyContent: 'space-between',
  },
});
