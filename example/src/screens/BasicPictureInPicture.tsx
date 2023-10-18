import React, { useCallback, useEffect, useState } from 'react';
import { Button, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  AudioSession,
  PictureInPictureConfig,
  PictureInPictureEnterEvent,
  PictureInPictureExitEvent,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamsList } from '../App';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

type BasicPictureInPictureNavigationProps = NativeStackScreenProps<
  RootStackParamsList,
  'BasicPictureInPicture'
>;

export default function BasicPictureInPicture({
  navigation,
}: BasicPictureInPictureNavigationProps) {
  useTVGestures();

  const [isPictureInPictureRequested, setIsPictureInPictureRequested] =
    useState(false);
  const [isInPictureInPicture, setIsInPictureInPicture] = useState(false);

  const pictureInPictureConfig: PictureInPictureConfig = {
    // Enable picture in picture UI option on player controls.
    isEnabled: true,
    // Enable entering picture in picture mode when transitioning the application to the background
    shouldEnterOnBackground: true,
  };

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

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
          "[BasicPictureInPicture] Failed to set app's audio category to `playback`:\n",
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

  useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Button
          title={isInPictureInPicture ? 'Exit PiP' : 'Enter PiP'}
          onPress={() =>
            setIsPictureInPictureRequested(() => !isInPictureInPicture)
          }
        />
      ),
    });
  }, [navigation, isInPictureInPicture]);

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[${event.name}]`, event);
  }, []);

  const onPictureInPictureEnterEvent = useCallback(
    (event: PictureInPictureEnterEvent) => {
      prettyPrint(`[${event.name}]`, event);
      setIsInPictureInPicture(true);
    },
    []
  );

  const onPictureInPictureExitEvent = useCallback(
    (event: PictureInPictureExitEvent) => {
      prettyPrint(`[${event.name}]`, event);
      setIsInPictureInPicture(false);
      setIsPictureInPictureRequested(false);
    },
    []
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        isPictureInPictureRequested={isPictureInPictureRequested}
        pictureInPictureConfig={pictureInPictureConfig}
        onPictureInPictureAvailabilityChanged={onEvent}
        onPictureInPictureEnter={onPictureInPictureEnterEvent}
        onPictureInPictureEntered={onEvent}
        onPictureInPictureExit={onPictureInPictureExitEvent}
        onPictureInPictureExited={onEvent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 10,
  },
  player: {
    flex: 1,
    backgroundColor: 'black',
  },
});
