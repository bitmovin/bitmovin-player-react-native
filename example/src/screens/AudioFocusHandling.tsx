import React, { useCallback, useState } from 'react';
import { View, Text, Switch, Button, StyleSheet, Platform } from 'react-native';
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

function Player({ handleAudioFocus }: { handleAudioFocus: boolean }) {
  const player = usePlayer({
    playbackConfig: {
      isBackgroundPlaybackEnabled: true,
      handleAudioFocus,
    },
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        type: SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/poster.jpg',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  return (
    <PlayerView
      player={player}
      style={styles.player}
      onPlay={onEvent}
      onPlaying={onEvent}
      onPaused={onEvent}
    />
  );
}

export default function AudioFocusHandling() {
  useTVGestures();

  const [handleAudioFocus, setHandleAudioFocus] = useState(false);
  const [appliedHandleAudioFocus, setAppliedHandleAudioFocus] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  const apply = useCallback(() => {
    setAppliedHandleAudioFocus(handleAudioFocus);
    setPlayerKey((k) => k + 1);
  }, [handleAudioFocus]);

  return (
    <View style={styles.container}>
      <Player key={playerKey} handleAudioFocus={appliedHandleAudioFocus} />
      <View style={styles.controls}>
        <View style={styles.row}>
          <Text style={styles.label}>handleAudioFocus</Text>
          <Switch
            value={handleAudioFocus}
            onValueChange={setHandleAudioFocus}
          />
        </View>
        <Text style={styles.hint}>
          Active:{' '}
          <Text style={styles.value}>{String(appliedHandleAudioFocus)}</Text>
          {'  '}—{' '}
          {appliedHandleAudioFocus
            ? 'Player pauses when another app takes audio focus.'
            : 'Player does not auto-pause on audio focus loss. Other interruptions can still pause playback.'}
        </Text>
        <Button title="Apply & Recreate Player" onPress={apply} />
        {Platform.OS === 'ios' && (
          <Text style={styles.warning}>
            handleAudioFocus is an Android-only option.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  player: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  controls: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#aaa',
    fontSize: 13,
  },
  value: {
    color: 'white',
    fontWeight: '600',
  },
  warning: {
    color: '#f90',
    fontSize: 13,
  },
});
