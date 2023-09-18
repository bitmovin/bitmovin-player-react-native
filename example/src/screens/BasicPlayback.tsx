import React, { useCallback, useState } from 'react';
import {
  View,
  Platform,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
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

export default function BasicPlayback() {
  useTVGestures();

  const player = usePlayer();

  useFocusEffect(
    useCallback(() => {
      player.load({
        url:
          Platform.OS === 'ios'
            ? 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
            : 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg',
        thumbnailTrack:
          'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/thumbnails/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.vtt',
        metadata: { platform: Platform.OS },
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

  const { width, height } = useWindowDimensions();
  interface PlayerControlPosition {
    yStart: number;
    yEnd: number;
  }

  let [isScrollEnabled, setScrollEnabled] = useState(true);
  let [playerControlPosition, setPlayerControlPosition] =
    useState<PlayerControlPosition>({
      yStart: 0,
      yEnd: 0,
    });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled={true}
        scrollEnabled={isScrollEnabled}
      >
        <View
          style={{ width: width, height: height, backgroundColor: 'red' }}
        />
        <View
          onStartShouldSetResponderCapture={(event) => {
            if (
              event.nativeEvent.locationY > playerControlPosition.yStart &&
              event.nativeEvent.locationY < playerControlPosition.yEnd
            ) {
              setScrollEnabled(false);
            } else {
              setScrollEnabled(true);
            }
            return false;
          }}
          style={{ width, backgroundColor: 'yellow', height: height }}
        >
          <View
            style={{ height: 'auto', width: 'auto' }}
            onLayout={(event) => {
              let layout = event.nativeEvent.layout;
              let controlsHeight = 35;
              let newPosition = {
                yStart: layout.y + layout.height - controlsHeight,
                yEnd: layout.y + layout.height,
              };
              setPlayerControlPosition(newPosition);
              console.log('calculated position', newPosition);
            }}
          >
            <PlayerView
              style={{ width, height: (width * 9) / 16 }}
              player={player}
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
            />
          </View>
        </View>
        <View
          style={{ width: width, height: height, backgroundColor: 'blue' }}
        />
      </ScrollView>
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
