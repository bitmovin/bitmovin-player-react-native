import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  SubtitleFormat,
} from 'bitmovin-player-react-native';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function SubtitlePlayback() {
  const player = usePlayer();

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8'
            : 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        poster: 'https://bitmovin-a.akamaihd.net/content/sintel/poster.png',
        // Custom subtitle tracks to be added on the source.
        subtitleTracks: [
          // Add dutch (nl) track and makes it the default.
          {
            url: 'https://raw.githubusercontent.com/bitmovin/bitmovin-player-react-native/feature/subtitle-tracks/example/assets/subtitles/sintel_nl.vtt',
            format: SubtitleFormat.VTT,
            label: 'Nederlands',
            language: 'nl',
          },
          // Add italian (it) track.
          // In some cases, the file format can be ommited and automatically selected by the SDK.
          {
            url: 'https://raw.githubusercontent.com/bitmovin/bitmovin-player-react-native/feature/subtitle-tracks/example/assets/subtitles/sintel_it.vtt',
            label: 'Italiano',
            language: 'it',
          },
        ],
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback(
    (_: Event) => {
      player.getAvailableSubtitles().then((subtitles) => {
        prettyPrint('AVAILABLE SUBTITLES', subtitles);
      });
    },
    [player]
  );

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onReady={onReady}
        onCueEnter={onEvent}
        onCueExit={onEvent}
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
});
