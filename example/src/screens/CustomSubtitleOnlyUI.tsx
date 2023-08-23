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
  Player,
  PlayerView,
  PlayingEvent,
  SourceType,
  StyleConfig,
  SubtitleView,
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

function newPlayer() {
  const styleConfig: StyleConfig =
    Platform.OS === 'android'
      ? {
          isUiEnabled: false,
        }
      : {
          userInterfaceType: UserInterfaceType.Subtitle,
        };
  return new Player({
    styleConfig,
    playbackConfig: {
      isAutoplayEnabled: true,
    },
  });
}

export default function CustomSubtitleOnlyUI() {
  useTVGestures();

  const [player, setPlayer] = useState<Player>(newPlayer());
  const [playing, setPlaying] = useState<boolean>(false);

  const [tracks, setTracks] = useState<TrackDisplay[]>([]);

  useFocusEffect(
    useCallback(() => {
      let effectPlayer = player;
      if (player.isDestroyed) {
        effectPlayer = newPlayer();
        setPlayer(effectPlayer);
      } else {
        player.load({
          url:
            Platform.OS === 'ios'
              ? 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
              : 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
          type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
          poster: 'https://bitmovin-a.akamaihd.net/content/sintel/poster.png',
        });
      }

      return () => {
        player.destroy();
        setPlaying(false);
      };
    }, [player])
  );

  const onReady = useCallback(
    async (event: Event) => {
      prettyPrint(`EVENT [${event.name}]`, event);
      const subtitleTracks = await player.getAvailableSubtitles();
      const identifiableTracks = subtitleTracks.filter(
        (t) => !!t.identifier && !!t.label
      );

      await player.setSubtitleTrack(identifiableTracks?.[0]?.identifier);

      setTracks(
        identifiableTracks.map(
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
          userDefaultStyle={false}
          userDefaultTextSize={false}
          fixedTextSize={{ size: 14, unit: 'COMPLEX_UNIT_DIP' }}
          captionStyle={{
            foregroundColor: '#FFFFFF',
            backgroundColor: '#000000',
            windowColor: '#AABBCC',
            edgeType: 'EDGE_TYPE_RAISED',
            edgeColor: '#000000',
            typeFace: {
              family: 'MONOSPACE',
              style: 'BOLD_ITALIC',
            },
          }}
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
