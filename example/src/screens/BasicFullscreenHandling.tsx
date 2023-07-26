import React, { useCallback, useRef, useState } from 'react';
import { View, Platform, StyleSheet, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AudioSession,
  FullscreenHandler,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import { RootStackParamsList } from '../App';

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
    this.isFullscreenActive = true;
    StatusBar.setHidden(true);
    console.log('enter fullscreen');
    this.onFullscreen(true);
  }

  exitFullscreen(): void {
    this.isFullscreenActive = false;
    StatusBar.setHidden(false);
    console.log('exit fullscreen');
    this.onFullscreen(false);
  }
}
export default function BasicFullscreenHandling({
  navigation,
}: BasicFullscreenHandlingProps) {
  useTVGestures();

  const player = usePlayer();

  const [fullscreenMode, setFullscreenMode] = useState(false);
  const fullscreenHandler = useRef(
    new SampleFullscreenHandler(fullscreenMode, (isFullscreen: boolean) => {
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
