import React, { useCallback, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  SubtitleFormat,
  CueEnterEvent,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

const IS_TV_OS = Platform.OS === 'ios' && Platform.isTV;

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function SubtitlePlayback() {
  useTVGestures();

  const [subtitleText, setSubtitleText] = useState<string | null>(null);

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
    playbackConfig: {
      isAutoplayEnabled: true,
    },
    styleConfig: {
      isUiEnabled: false,
    },
  });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios' || IS_TV_OS
            ? 'https://cdn.bitmovin.com/content/internal/assets/sintel/hls/playlist.m3u8'
            : 'https://cdn.bitmovin.com/content/internal/assets/sintel/sintel.mpd',
        type:
          Platform.OS === 'ios' || IS_TV_OS ? SourceType.HLS : SourceType.DASH,
        poster:
          'https://cdn.bitmovin.com/content/internal/assets/sintel/poster.png',
        // External subtitle tracks to be added to the source.
        subtitleTracks: [
          // Add custom english subtitles. You can select 'Custom English (WebVTT)' in the subtitles menu.
          {
            url: 'https://cdn.bitmovin.com/content/internal/assets/sintel/subtitles/subtitles_en.vtt',
            label: 'Custom English (WebVTT)',
            language: 'en',
            format: SubtitleFormat.VTT,
          },
          // Add custom english subtitles. You can select 'Custom English (SRT)' in the subtitles menu.
          {
            url: 'https://cdn.bitmovin.com/content/internal/assets/sintel/subtitles/subtitles_en.srt',
            label: 'Custom English (SRT)',
            language: 'en',
            format: SubtitleFormat.SRT,
          },
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

  // On tvOS, drive subtitle display ourselves using native UI elements.
  const onCueEnter = useCallback((event: CueEnterEvent) => {
    prettyPrint(`EVENT [${event.name}]`, event);
    if (IS_TV_OS) {
      setSubtitleText(event.text ?? null);
    }
  }, []);

  const onCueExit = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
    if (IS_TV_OS) {
      setSubtitleText(null);
    }
  }, []);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onCueEnter={onCueEnter}
        onCueExit={onCueExit}
        onSubtitleAdded={onEvent}
        onSubtitleChanged={onEvent}
        onSubtitleRemoved={onEvent}
      />
      {IS_TV_OS && subtitleText != null && (
        <View style={styles.subtitleContainer} pointerEvents="none">
          <Text style={styles.subtitleText}>{subtitleText}</Text>
        </View>
      )}
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
  subtitleContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 80,
  },
  subtitleText: {
    color: 'green',
    fontSize: 32,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
