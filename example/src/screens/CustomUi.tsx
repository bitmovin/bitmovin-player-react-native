import React, { useCallback, useState } from 'react';
import {
  View,
  Platform,
  StyleSheet,
  Dimensions,
  useTVEventHandler,
  HWEvent,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PlayerControls } from '../components/PlayerControls';
import { ProgressBar } from '../components/ProgressBar';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
} from 'bitmovin-player-react-native';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

interface State {
  play: boolean;
  currentTime: number;
  duration: number;
  showControls: boolean;
}

export default function CustomUi() {
  const [state, setState] = useState<State>({
    play: false,
    currentTime: 0,
    duration: 0,
    showControls: true,
  });

  const myTVEventHandler = (evt: HWEvent) => {
    if (!state.showControls) {
      if (
        evt &&
        (evt.eventType === 'right' ||
          evt.eventType === 'left' ||
          evt.eventType === 'up' ||
          evt.eventType === 'down')
      ) {
        showControls();
      }
    }
  };

  useTVEventHandler(myTVEventHandler);

  const player = usePlayer({
    styleConfig: {
      isUiEnabled: false,
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

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onSourceLoaded = useCallback(
    (event: Event) => {
      onEvent(event);
      // Dinamically schedule an ad to play after the video
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

    setTimeout(() => {
      setState((s) => ({ ...s, showControls: false }));
    }, 2000);
  }

  function skipBackward() {
    player.seek(state.currentTime - 15);
    setState({ ...state, currentTime: state.currentTime - 15 });
    setTimeout(() => {
      setState((s) => ({ ...s, showControls: false }));
    }, 2000);
  }

  function skipForward() {
    player.seek(state.currentTime + 15);
    setState({ ...state, currentTime: state.currentTime + 15 });
    setTimeout(() => {
      setState((s) => ({ ...s, showControls: false }));
    }, 2000);
  }

  function onSeek(seekTime: number) {
    player.seek(seekTime);

    setTimeout(() => {
      setState((s) => ({ ...s, showControls: false }));
    }, 2000);
  }

  function showControls() {
    state.showControls
      ? setState({ ...state, showControls: false })
      : setState({ ...state, showControls: true });
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
        onSourceLoaded={onSourceLoaded}
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
