import React, { useCallback, useMemo, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  PlayerView,
  Source,
  SourceType,
  usePlayer,
} from 'bitmovin-player-react-native';

export default function BasicPlaylist() {
  const player = usePlayer();
  const sources = useMemo(
    () => [
      new Source({
        url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
        type: SourceType.HLS,
        title: 'Art of Motion',
        metadata: { title: 'Art of Motion' },
      }),
      new Source({
        url: 'https://cdn.bitmovin.com/content/internal/assets/sintel/hls/playlist.m3u8',
        type: SourceType.HLS,
        title: 'Sintel',
        metadata: { title: 'Sintel' },
      }),
    ],
    []
  );
  const [active, setActive] = useState('Art of Motion');
  const [error, setError] = useState('');
  const reportError = (error: unknown) => setError(String(error));

  useFocusEffect(
    useCallback(() => {
      void player
        .loadPlaylist({ sources, options: { preloadAllSources: true } })
        .catch(reportError);
      return () => player.destroy();
    }, [player, sources])
  );

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPlaylistTransition={(event) =>
          setActive(String(event.to.metadata?.title))
        }
      />
      <Text style={styles.label}>Active source: {active}</Text>
      <Text style={styles.error}>{error}</Text>
      <Button title="Play" onPress={() => player.play()} />
      {sources.map((source, index) => (
        <Button
          key={source.nativeId}
          title={`Seek to ${source.config?.title}`}
          onPress={() => {
            void player.playlist.seek(sources[index], 0).catch(reportError);
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  player: { flex: 1 },
  label: { color: 'white', textAlign: 'center', margin: 8 },
  error: { color: 'red', textAlign: 'center' },
});
