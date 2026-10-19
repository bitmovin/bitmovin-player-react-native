import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const streamType = Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH;

type ActionButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  variant?: 'default' | 'add';
};

function ActionButton({
  title,
  onPress,
  disabled,
  compact,
  variant = 'default',
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        compact && styles.compactButton,
        variant === 'add' && styles.addButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text
        style={[
          styles.actionText,
          variant === 'add' && styles.addText,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function streamConfig(url: string, title: string): SourceConfig {
  return {
    url,
    type: streamType,
    title,
    metadata: { title },
  };
}

function createSource(config: SourceConfig) {
  return new Source({
    ...config,
    metadata: config.metadata ? { ...config.metadata } : undefined,
  });
}

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

function sourceTitle(source?: Source) {
  return source?.config?.title ?? source?.nativeId ?? 'None';
}

export default function PlaylistPlayback() {
  useTVGestures();
  const insets = useSafeAreaInsets();

  const [playlistSources, setPlaylistSources] = useState<Source[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<string>();
  const [selectedCatalogIndex, setSelectedCatalogIndex] = useState(0);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [lastEvent, setLastEvent] = useState('None');

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  const catalog = useMemo(
    () => [
      streamConfig(
        Platform.OS === 'ios'
          ? 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
          : 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        'Art of Motion'
      ),
      streamConfig(
        Platform.OS === 'ios'
          ? 'https://cdn.bitmovin.com/content/assets/sintel/hls/playlist.m3u8'
          : 'https://cdn.bitmovin.com/content/assets/sintel/sintel.mpd',
        'Sintel'
      ),
      streamConfig(
        Platform.OS === 'ios'
          ? 'https://cdn.bitmovin.com/content/assets/bbb/stream.m3u8'
          : 'https://cdn.bitmovin.com/content/assets/bbb/stream.mpd',
        'Big Buck Bunny'
      ),
    ],
    []
  );

  const playlistRows = useMemo(() => {
    const totals = new Map<string, number>();
    playlistSources.forEach((source) => {
      const title = sourceTitle(source);
      totals.set(title, (totals.get(title) ?? 0) + 1);
    });

    const seen = new Map<string, number>();
    return playlistSources.map((source) => {
      const title = sourceTitle(source);
      const occurrence = (seen.get(title) ?? 0) + 1;
      seen.set(title, occurrence);
      return {
        source,
        label: (totals.get(title) ?? 0) > 1 ? `${title} #${occurrence}` : title,
      };
    });
  }, [playlistSources]);

  const selectedSource = playlistSources.find(
    (source) => source.nativeId === selectedSourceId
  );
  const selectedCatalog = catalog[selectedCatalogIndex];

  const reportError = useCallback((error: unknown) => {
    console.error(error);
    setLastEvent(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }, []);

  const refreshSources = useCallback(async () => {
    setPlaylistSources(await player.playlist.getSources());
  }, [player]);

  const loadPlaylist = useCallback(() => {
    const sources = catalog.slice(0, 2).map(createSource);
    setLastEvent('reset');
    void player
      .loadPlaylist(sources, { replayMode: ReplayMode.PLAYLIST })
      .then(() => {
        setActiveSourceId(player.source?.nativeId);
        setSelectedSourceId(sources[1]?.nativeId ?? sources[0].nativeId);
      })
      .catch(reportError);
  }, [catalog, player, reportError]);

  useFocusEffect(
    useCallback(() => {
      const subscriptions = [
        player.playlist.addEventListener('sourceAdded', (event) => {
          prettyPrint(`PLAYLIST [${event.name}]`, event);
          setLastEvent(
            `added: ${event.sourceReference?.config?.title ?? 'source'}`
          );
          void refreshSources().catch(reportError);
        }),
        player.playlist.addEventListener('sourceRemoved', (event) => {
          prettyPrint(`PLAYLIST [${event.name}]`, event);
          setLastEvent(
            `removed: ${event.sourceReference?.config?.title ?? 'source'}`
          );
          void refreshSources().catch(reportError);
          setSelectedSourceId((currentId) =>
            currentId === event.sourceNativeId ? undefined : currentId
          );
        }),
        player.playlist.addEventListener('playlistTransition', (event) => {
          prettyPrint(`PLAYLIST [${event.name}]`, event);
          setActiveSourceId(event.toSourceNativeId);
          setLastEvent(
            `transition: ${event.from.metadata?.title ?? 'source'} → ${
              event.to.metadata?.title ?? 'source'
            }`
          );
        }),
      ];

      loadPlaylist();

      return () => {
        subscriptions.forEach((subscription) => subscription.remove());
        player.destroy();
      };
    }, [loadPlaylist, player, refreshSources, reportError])
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const addSource = useCallback(() => {
    const source = createSource(selectedCatalog);
    void player.playlist
      .add(source)
      .then(() => setSelectedSourceId(source.nativeId))
      .catch(reportError);
  }, [player, reportError, selectedCatalog]);

  const removeSource = useCallback(() => {
    if (selectedSource) {
      void player.playlist.remove(selectedSource).catch(reportError);
    }
  }, [player, reportError, selectedSource]);

  const seekToSource = useCallback(() => {
    if (selectedSource) {
      void player.playlist.seek(selectedSource, 0).catch(reportError);
    }
  }, [player, reportError, selectedSource]);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onReady={onEvent}
        onSourceLoaded={onEvent}
        onPlay={onEvent}
        onPlaying={onEvent}
        onPaused={onEvent}
        onSeek={onEvent}
        onSeeked={onEvent}
      />
      <ScrollView
        style={styles.controls}
        contentContainerStyle={{
          ...styles.controlsContent,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <Text style={styles.description}>
          Choose a catalog source and add it. Select a playlist source to seek
          or remove.
        </Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Catalog</Text>
          <View style={styles.catalogRow}>
            {catalog.map((config, index) => {
              const isSelected = selectedCatalogIndex === index;
              return (
                <Pressable
                  key={config.title}
                  accessibilityRole="button"
                  onPress={() => setSelectedCatalogIndex(index)}
                  style={[
                    styles.catalogChip,
                    isSelected && styles.selectedChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.catalogText,
                      isSelected && styles.selectedChipText,
                    ]}
                  >
                    {config.title}
                  </Text>
                </Pressable>
              );
            })}
            <ActionButton
              title="+ Add selected"
              onPress={addSource}
              compact
              variant="add"
            />
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.section}>
            <View style={styles.headingRow}>
              <Text style={styles.heading}>Playlist</Text>
              <ActionButton title="Reset" onPress={loadPlaylist} compact />
            </View>
            <ScrollView style={styles.list}>
              {playlistRows.map(({ source, label }, index) => {
                const isActive = source.nativeId === activeSourceId;
                const isSelected = source.nativeId === selectedSourceId;
                return (
                  <Pressable
                    key={source.nativeId}
                    accessibilityRole="button"
                    onPress={() => setSelectedSourceId(source.nativeId)}
                  >
                    <Text
                      style={[
                        styles.listItem,
                        isActive && styles.activeItem,
                        isSelected && styles.selectedItem,
                      ]}
                    >
                      {isActive ? '▶ ' : '  '}
                      {isSelected ? '● ' : '  '}
                      {index + 1}. {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.playlistActions}>
              <ActionButton
                title="Remove"
                onPress={removeSource}
                disabled={!selectedSource}
                compact
              />
              <ActionButton
                title="Seek"
                onPress={seekToSource}
                disabled={!selectedSource}
                compact
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.heading}>Last event</Text>
            <Text style={styles.eventItem}>{lastEvent}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  player: {
    flex: 0.85,
  },
  controls: {
    flex: 1.15,
    backgroundColor: 'white',
  },
  controlsContent: {
    padding: 8,
  },
  description: {
    color: '#333',
    marginBottom: 6,
  },
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  catalogRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  catalogChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  selectedChip: {
    borderWidth: 2,
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  catalogText: {
    color: '#333',
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#174ea6',
  },
  mainContent: {
    gap: 8,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heading: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  list: {
    maxHeight: 100,
  },
  listItem: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    color: '#222',
  },
  activeItem: {
    fontWeight: 'bold',
    color: '#137333',
  },
  selectedItem: {
    backgroundColor: '#fff4ce',
  },
  eventItem: {
    color: '#444',
    paddingVertical: 1,
  },
  playlistActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
  },
  compactButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#137333',
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  addText: {
    color: 'white',
  },
  disabledText: {
    color: '#777',
  },
});
