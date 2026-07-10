import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function EnableDisableMediaControls() {
  useTVGestures();

  const [isMediaControlsEnabled, setIsMediaControlsEnabled] = useState(true);

  const player = usePlayer({
    playbackConfig: {
      isBackgroundPlaybackEnabled: true,
    },
    mediaControlConfig: {
      isEnabled: true,
    },
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
        type: SourceType.HLS,
        title: 'Art of Motion',
        poster:
          'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/poster.jpg',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback(
    async (event: Event) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      setIsMediaControlsEnabled(await player.mediaControls.isEnabled());
    },
    [player]
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const toggleMediaControls = useCallback(async () => {
    await player.mediaControls.setEnabled(!isMediaControlsEnabled);
    setIsMediaControlsEnabled(await player.mediaControls.isEnabled());
  }, [isMediaControlsEnabled, player]);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onReady={onReady}
        onSourceLoaded={onEvent}
        onSeek={onEvent}
        onSeeked={onEvent}
        onStallStarted={onEvent}
        onStallEnded={onEvent}
      />
      <View style={styles.controls}>
        <Text style={styles.statusText}>
          Media controls integration is{' '}
          {isMediaControlsEnabled ? 'ENABLED' : 'DISABLED'}
        </Text>
        <Text style={styles.hintText}>
          Background the app or open Control Center to check the Now Playing
          info.
        </Text>
        <Button
          title={
            isMediaControlsEnabled
              ? 'Disable Media Controls'
              : 'Enable Media Controls'
          }
          onPress={toggleMediaControls}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  player: {
    flex: 1,
  },
  controls: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'black',
  },
  statusText: {
    color: 'white',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    color: 'lightgray',
    marginBottom: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});
