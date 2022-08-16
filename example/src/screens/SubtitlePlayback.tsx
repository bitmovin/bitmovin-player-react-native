import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
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
        // External subtitle tracks to be added to the source.
        subtitleTracks: [
          // Add custom english subtitles. You can select 'Custom English' in the subtitles menu.
          {
            url: 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt',
            label: 'Custom English',
            language: 'en',
            identifier: 'sub1',
          },
          // You may add more subtitle options in this list...
        ],
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
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onCueEnter={onEvent}
        onCueExit={onEvent}
        onSubtitleAdded={onEvent}
        onSubtitleChanged={onEvent}
        onSubtitleRemoved={onEvent}
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
