import React, { useCallback, useState } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  PausedEvent,
  PlayerView,
  PlayingEvent,
  SourceType,
  StyleConfig,
  SubtitleView,
  usePlayer,
  UserInterfaceType,
} from 'bitmovin-player-react-native';
import Play from '../components/icons/Play.svg';
import Pause from '../components/icons/Pause.svg';
import Backward from '../components/icons/Backward.svg';
import Forward from '../components/icons/Forward.svg';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

interface TrackDisplay {
  display: string;
  identifier: string;
}

const Separator = () => <View style={styles.separator} />;

const trackDisplayKeyExtractor = ({ identifier }: TrackDisplay) => identifier;

export default function CustomSubtitleOnlyUI() {
  useTVGestures();
  const [playing, setPlaying] = useState<boolean>(false);

  const styleConfig: StyleConfig =
    Platform.OS === 'android'
      ? {
          isUiEnabled: false,
        }
      : {
          userInterfaceType: UserInterfaceType.subtitle,
        };

  const player = usePlayer({
    styleConfig,
  });
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
      const subtitleTracks = await player.getAvailableSubtitles();

      setTracks(
        subtitleTracks
          .filter((t) => !!t.identifier && !!t.label)
          .map(
            (t): TrackDisplay => ({
              display: t.label as string,
              identifier: t.identifier as string,
            })
          )
      );
    },
    [player]
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onPlaying = useCallback(
    (event: PlayingEvent) => {
      onEvent(event);
      setPlaying(true);
    },
    [onEvent]
  );

  const onPaused = useCallback(
    (event: PausedEvent) => {
      onEvent(event);
      setPlaying(false);
    },
    [onEvent]
  );

  const renderTrack = useCallback(
    ({ item }: ListRenderItemInfo<TrackDisplay>) => {
      return (
        <TouchableOpacity
          style={styles.trackItem}
          onPress={() => player.setSubtitleTrack(item.identifier)}
        >
          <Text style={styles.trackItemText}>{item.display}</Text>
        </TouchableOpacity>
      );
    },
    [player]
  );

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <PlayerView
          player={player}
          style={styles.player}
          onReady={onReady}
          onEvent={onEvent}
          onPlaying={onPlaying}
          onPaused={onPaused}
          onAudioChanged={onEvent}
          onSubtitleChanged={onEvent}
        />
        <SubtitleView
          player={player.isInitialized ? player : undefined}
          style={styles.subtitles}
          applyEmbeddedStyles={false}
          userDefaultStyle={true}
          userDefaultTextSize={true}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlItem}
          onPress={async () => {
            const currentTime = await player.getCurrentTime('absolute');
            player.seek(currentTime - 10);
          }}
        >
          <Backward color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlItem}
          onPress={() => (playing ? player.pause() : player.play())}
        >
          {playing ? <Pause color="black" /> : <Play color="black" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlItem}
          onPress={async () => {
            const currentTime = await player.getCurrentTime('absolute');
            player.seek(currentTime + 10);
          }}
        >
          <Forward color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={tracks}
        style={styles.tracks}
        keyExtractor={trackDisplayKeyExtractor}
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
  playerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
  },
  player: {
    flex: 1,
  },
  subtitles: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  controls: {
    flex: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    alignSelf: 'stretch',
  },
  controlItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
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
