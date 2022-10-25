import React, { useCallback, useState } from 'react';
import {
  Text,
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
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

interface TrackDisplay {
  display: string;
  type: 'audio' | 'subtitle';
  identifier: string;
}

const Separator = () => <View style={styles.separator} />;

export default function ProgrammaticTrackSelection() {
  useTVGestures();

  const player = usePlayer();
  const [tracks, setTracks] = useState<TrackDisplay[]>([]);

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
            : 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        poster: 'https://bitmovin-a.akamaihd.net/content/sintel/poster.png',
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback(
    async (event: Event) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      const audioTracks = await player.getAvailableAudioTracks();
      const subtitleTracks = await player.getAvailableSubtitles();

      setTracks([
        ...audioTracks.map(
          (track) =>
            ({
              display: track.label,
              identifier: track.identifier,
              type: 'audio',
            } as TrackDisplay)
        ),
        ...subtitleTracks.map(
          (track) =>
            ({
              display: track.label,
              identifier: track.identifier,
              type: 'subtitle',
            } as TrackDisplay)
        ),
      ]);
    },
    [player]
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const renderTrack = useCallback(
    ({ item }: ListRenderItemInfo<TrackDisplay>) => {
      const setTrack =
        item.type === 'audio' ? player.setAudioTrack : player.setSubtitleTrack;

      return (
        <TouchableOpacity
          style={styles.trackItem}
          onPress={() => setTrack(item.identifier)}
        >
          <Text style={styles.trackItemText}>
            {item.type}: {item.display}
          </Text>
        </TouchableOpacity>
      );
    },
    [player]
  );

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onReady={onReady}
        onEvent={onEvent}
        onAudioChanged={onEvent}
        onSubtitleChanged={onEvent}
      />
      <FlatList
        data={tracks}
        style={styles.tracks}
        keyExtractor={({ identifier }) => identifier}
        renderItem={renderTrack}
        ListHeaderComponent={Separator}
        ListFooterComponent={Separator}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  player: {
    flex: 1,
  },
  tracks: {
    flex: 1,
    backgroundColor: 'white',
    alignSelf: 'stretch',
  },
  trackItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trackItemText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'gray',
  },
});
