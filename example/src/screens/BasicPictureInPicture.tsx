import type { JSX } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  PictureInPictureAction,
  PictureInPictureEnterEvent,
  PictureInPictureExitEvent,
  PlayerView,
  PlayerViewConfig,
  SourceType,
  usePlayer,
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

  const config: PlayerViewConfig = {
    pictureInPictureConfig: {
      // Enable picture in picture UI option on player controls.
      isEnabled: true,
      // Enable entering picture in picture mode when transitioning the application to the background
      shouldEnterOnBackground: true,
      pictureInPictureActions: [
        PictureInPictureAction.TogglePlayback,
        PictureInPictureAction.Seek,
      ],
    },
  };

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      // Load desired source configuration
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

  // Since PiP on Android is basically just the whole activity fitted in a small
  // floating window, we only want to render the player and hide any other UI.
  let renderOnlyPlayerView = Platform.OS === 'android' && isInPictureInPicture;

  useEffect(() => {
    navigation.setOptions({
      headerShown: !Platform.isTV && !renderOnlyPlayerView,
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        Platform.isTV ? undefined : (
          <Button
            title={isInPictureInPicture ? 'Exit PiP' : 'Enter PiP'}
            onPress={() =>
              setIsPictureInPictureRequested(() => !isInPictureInPicture)
            }
          />
        ),
    });
  }, [navigation, isInPictureInPicture, renderOnlyPlayerView]);

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

  const ContainerView = Platform.isTV ? View : SafeAreaContainer;
  return (
    <ContainerView
      style={
        // On Android, we need to remove the padding from the container when in PiP mode.
        renderOnlyPlayerView
          ? [styles.container, { padding: 0 }]
          : styles.container
      }
    >
      <PlayerView
        player={player}
        style={styles.player}
        isPictureInPictureRequested={isPictureInPictureRequested}
        config={config}
        onPictureInPictureAvailabilityChanged={onEvent}
        onPictureInPictureEnter={onPictureInPictureEnterEvent}
        onPictureInPictureEntered={onEvent}
        onPictureInPictureExit={onPictureInPictureExitEvent}
        onPictureInPictureExited={onEvent}
      />
    </ContainerView>
  );
}

function SafeAreaContainer(props: ViewProps): JSX.Element {
  return <SafeAreaView edges={['bottom', 'left', 'right']} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: Platform.isTV ? 0 : 10,
  },
  player: {
    flex: 1,
    backgroundColor: 'black',
  },
});
