import React, { useCallback } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  SubtitleAddedEvent,
  usePlayer,
  PlayerView,
  SourceType,
  SubtitleFormat,
  UserInterfaceType,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function NoUiSubtitlesOnly() {
  useTVGestures();

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
    styleConfig: {
      isUiEnabled: true,
      userInterfaceType: UserInterfaceType.Subtitle,
    },
    playbackConfig: {
      isAutoplayEnabled: true,
    },
  });

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
            language: 'en-custom',
            format: SubtitleFormat.VTT,
          },
        ],
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onSubtitleAdded = useCallback(
    (event: SubtitleAddedEvent) => {
      if (event.subtitleTrack.language === 'en-custom') {
        prettyPrint('Automatically selecting custom subtitle', event);
        player.setSubtitleTrack(event.subtitleTrack.identifier);
      }
    },
    [player]
  );

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
        onVideoPlaybackQualityChanged={onEvent}
        onSubtitleAdded={onSubtitleAdded}
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
