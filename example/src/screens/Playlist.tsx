import React, { useCallback, useEffect, useState } from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  PlayerView,
  ReplayMode,
  Source,
  SourceConfig,
  SourceType,
  usePlayer,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

const artOfMotion: SourceConfig = {
  url:
    Platform.OS === 'ios'
      ? 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
      : 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
  type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
  title: 'Art of Motion',
  poster:
    'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/poster.jpg',
};

const sintel: SourceConfig = {
  url:
    Platform.OS === 'ios'
      ? 'https://cdn.bitmovin.com/content/internal/assets/sintel/hls/playlist.m3u8'
      : 'https://cdn.bitmovin.com/content/internal/assets/sintel/sintel.mpd',
  type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
  title: 'Sintel',
  poster: 'https://cdn.bitmovin.com/content/internal/assets/sintel/poster.png',
};

export default function Playlist() {
  useTVGestures();

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSource, setActiveSource] = useState<Source>();
  const [loadedSourceIds, setLoadedSourceIds] = useState<Set<string>>(
    new Set()
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const refreshPlaylist = useCallback(async () => {
    setSources(await player.playlist.getSources());
    setActiveSource(await player.getSource());
  }, [player]);

  useEffect(() => {
    const onPlaylistEvent = (event: Event) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      void refreshPlaylist();
    };
    const subscriptions = [
      player.on('playerActive', onPlaylistEvent),
      player.on('playlistTransition', onPlaylistEvent),
      player.on('sourceAdded', onPlaylistEvent),
      player.on('sourceRemoved', onPlaylistEvent),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [player, refreshPlaylist]);

  // Source events are also emitted while a source is inactive, e.g. when it has been preloaded.
  const createSource = useCallback((config: SourceConfig) => {
    const source = new Source(config);
    const setLoaded = (isLoaded: boolean) =>
      setLoadedSourceIds((ids) => {
        const updated = new Set(ids);
        if (isLoaded) {
          updated.add(source.nativeId);
        } else {
          updated.delete(source.nativeId);
        }
        return updated;
      });
    source.on('sourceLoaded', () => setLoaded(true));
    source.on('sourceUnloaded', () => setLoaded(false));
    return source;
  }, []);

  const onPlayerViewReady = useCallback(() => {
    void player.loadPlaylist({
      sources: [createSource(artOfMotion), createSource(sintel)],
      options: {
        preloadAllSources: true,
        replayMode: ReplayMode.Playlist,
      },
    });
  }, [player, createSource]);

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const seekToSourceAt = useCallback(
    (index: number) => {
      const source = sources[index];
      if (source) {
        void player.playlist.seek(source, 0);
      }
    },
    [player, sources]
  );

  const activeIndex = activeSource ? sources.indexOf(activeSource) : -1;

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onPlayerViewReady={onPlayerViewReady}
        onPlaybackFinished={onEvent}
      />
      <View style={styles.controls}>
        {sources.map((source, index) => (
          <Text key={source.nativeId} style={styles.sourceText}>
            {index === activeIndex ? '▶ ' : '   '}
            {index + 1}. {source.config?.title}
            {loadedSourceIds.has(source.nativeId) ? ' (loaded)' : ''}
          </Text>
        ))}
        <View style={styles.buttons}>
          <Button
            title="Previous"
            onPress={() => seekToSourceAt(activeIndex - 1)}
          />
          <Button
            title="Next"
            onPress={() => seekToSourceAt(activeIndex + 1)}
          />
          <Button
            title="Add"
            onPress={() =>
              void player.playlist.add(
                createSource({
                  ...artOfMotion,
                  title: `Art of Motion #${sources.length + 1}`,
                })
              )
            }
          />
          <Button
            title="Remove last"
            onPress={() => void player.playlist.removeAt(sources.length - 1)}
          />
        </View>
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
    backgroundColor: 'black',
  },
  sourceText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 8,
  },
});
