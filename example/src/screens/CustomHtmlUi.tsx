import React, { useCallback, useRef } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  CustomMessageHandler,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import Button from '../components/Button';
import { RootStackParamsList } from '../App';

type CustomHtmlUiProps = NativeStackScreenProps<
  RootStackParamsList,
  'CustomHtmlUi'
>;

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function CustomHtmlUi({ navigation }: CustomHtmlUiProps) {
  useTVGestures();

  const customMessageHandler = useRef(
    new CustomMessageHandler({
      onReceivedSynchronousMessage: (
        message: string,
        payload: string | undefined
      ) => {
        if (message === 'closePlayer') {
          navigation.pop();
        }
        prettyPrint('Received synchronous message', { message, payload });
        return undefined;
      },
      onReceivedAsynchronousMessage: (
        message: string,
        payload: string | undefined
      ) => {
        prettyPrint('Received asynchronous message', { message, payload });
      },
    })
  ).current;

  const player = usePlayer({
    styleConfig: {
      playerUiCss:
        'https://cdn.statically.io/gh/bitmovin/bitmovin-player-ios-samples/main/CustomHtmlUi/Supporting%20Files/bitmovinplayer-ui.min.css',
      playerUiJs:
        'https://cdn.statically.io/gh/bitmovin/bitmovin-player-ios-samples/main/CustomHtmlUi/Supporting%20Files/bitmovinplayer-ui.min.js',
      supplementalPlayerUiCss:
        'https://storage.googleapis.com/bitmovin-player-cdn-origin/player/ui/ui-customized-sample.css',
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

  const onReady = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        customMessageHandler={customMessageHandler}
        style={styles.player}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
      />
      <Button
        containerStyle={styles.buttonContainer}
        title="Toggle Close Button State"
        onPress={() => {
          customMessageHandler.sendMessage('toggleCloseButton', undefined);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  player: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  buttonContainer: {
    margin: 5,
  },
});
