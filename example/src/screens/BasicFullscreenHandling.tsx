import React, { useCallback, useState } from 'react';
import { View, Platform, StyleSheet, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  usePlayer,
  PlayerView,
  SourceType,
  AudioSession,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import { FullscreenHandler } from '../../../src/ui/fullscreenhandler';

export default function BasicFullscreenHandling({ navigation }) {
  const [isFullscreen, setFullscreen] = useState(false);

  class SampleFullscreenHandler implements FullscreenHandler {
    isFullscreenActive: boolean = false;

    enterFullscreen(): void {
      StatusBar.setHidden(true);
      navigation.setOptions({ headerShown: false });

      this.isFullscreenActive = true;
      console.log('enter fullscreen');

      setFullscreen(true);
    }

    exitFullscreen(): void {
      StatusBar.setHidden(false);
      navigation.setOptions({ headerShown: true });

      this.isFullscreenActive = false;
      console.log('exit fullscreen');

      setFullscreen(false);
    }
  }

  useTVGestures();

  const player = usePlayer();

  const fullscreenHandler = new SampleFullscreenHandler();

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

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={isFullscreen ? styles.playerFullscreen : styles.player}
        fullscreenHandler={fullscreenHandler}
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
  buttonContainer: {
    margin: 20,
    alignSelf: 'stretch',
  },
});
