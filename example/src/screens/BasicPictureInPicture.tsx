import type { JSX } from 'react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AppState,
  Button,
  Platform,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
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
import { PictureInPictureAction } from 'bitmovin-player-react-native/components/PlayerView/pictureInPictureAction';

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
  const [isEnteringBackground, setIsEnteringBackground] = useState(false);
  const pictureInPictureActions = [
    PictureInPictureAction.TogglePlayback,
    PictureInPictureAction.Seek,
  ];

  const config: PlayerViewConfig = {
    pictureInPictureConfig: {
      // Enable picture in picture UI option on player controls.
      isEnabled: true,
      // Enable entering picture in picture mode when transitioning the application to the background
      shouldEnterOnBackground: true,
    },
  };

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
    playbackConfig: {
      isBackgroundPlaybackEnabled: false,
    },
    mediaControlConfig: {
      isEnabled: false,
    },
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setIsEnteringBackground(true);
      } else if (nextState === 'active') {
        setIsEnteringBackground(false);
      }
    });

    return () => subscription.remove();
  }, []);

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
  const renderOnlyPlayerView =
    Platform.OS === 'android' &&
    (isInPictureInPicture ||
      isPictureInPictureRequested ||
      // The UI should be updated before entering Picture in Picture mode
      // because JS execution is unreliable while the app is in the background.
      isEnteringBackground);

  const showCustomHeader = !Platform.isTV && !renderOnlyPlayerView;

  const handleTogglePiP = useCallback(() => {
    setIsPictureInPictureRequested(!isInPictureInPicture);
  }, [isInPictureInPicture]);

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

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
      {showCustomHeader && (
        <View style={styles.header}>
          <Button title="Back" onPress={handleGoBack} />
          <Button
            title={isInPictureInPicture ? 'Exit PiP' : 'Enter PiP'}
            onPress={handleTogglePiP}
          />
        </View>
      )}
      <View style={styles.playerWrapper}>
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
          pictureInPictureActions={pictureInPictureActions}
        />
      </View>
    </ContainerView>
  );
}

function SafeAreaContainer(props: ViewProps): JSX.Element {
  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: Platform.isTV ? 0 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.isTV ? 0 : 10,
  },
  playerWrapper: {
    flex: 1,
  },
  player: {
    flex: 1,
    backgroundColor: 'black',
  },
});
