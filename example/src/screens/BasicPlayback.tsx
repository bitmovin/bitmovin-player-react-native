import React, { PropsWithChildren, useCallback, useState } from 'react';
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

/**
 * Calculated Y-coordinates where the seekbar is located on the screen
 */
interface SeekbarCoordinates {
  yStart: number;
  yEnd: number;
}

interface MeasurePlayerSeekbarProps {
  onMeasured: (seekbarCoordinates: SeekbarCoordinates) => void;
}

/**
 * View that wraps around the PlayerView, measures it and calculates the position of the seekbar on the screen.
 */
const MeasurePlayerSeekbar: React.FC<
  PropsWithChildren<MeasurePlayerSeekbarProps>
> = ({ children, onMeasured }) => (
  <View
    onLayout={(event) => {
      let layout = event.nativeEvent.layout;
      let seekbarHeight = 40;
      let seekbarPosition = {
        yStart: layout.y + layout.height - seekbarHeight,
        yEnd: layout.y + layout.height,
      };
      onMeasured(seekbarPosition);
    }}
  >
    {children}
  </View>
);

interface ScrollViewControllerProps {
  seekbarCoordinates: SeekbarCoordinates;
  onScrollViewEnableOrDisable: (enable: boolean) => void;
}

/**
 * View that receives touch events and calculates if they are happening where the seekbar is laid out.
 * Based on that it can change the `scrollView.isScrollable` prop via the `onScrollViewEnabledOrDisabled` callback.
 * This view should be stretched through the whole area where the ScrollView should be scrollable,
 * so that the scrollView is enabled again if touches happen outside the player view.
 */
const ScrollViewController: React.FC<
  PropsWithChildren<ScrollViewControllerProps>
> = ({ children, seekbarCoordinates, onScrollViewEnableOrDisable }) => (
  <View
    onStartShouldSetResponderCapture={(event) => {
      let locationY = event.nativeEvent.locationY;
      let enableScrollView =
        locationY < seekbarCoordinates.yStart ||
        locationY > seekbarCoordinates.yEnd;
      onScrollViewEnableOrDisable(enableScrollView);

      // Always return false to propagate touch event to the children,
      // otherwise the player UI doesn't receive touch events.
      return false;
    }}
  >
    {children}
  </View>
);

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

  let [isScrollViewEnabled, setScrollViewEnabled] = useState(true);
  let [seekbarCoordinates, setSeekbarCoordinates] =
    useState<SeekbarCoordinates>({
      yStart: 0,
      yEnd: 0,
    });

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled={true}
        scrollEnabled={isScrollViewEnabled}
      >
        <View
          key="sampleScreen1"
          style={{ width: width, height: height, backgroundColor: 'red' }}
        />
        <ScrollViewController
          key="sampleScreen2"
          seekbarCoordinates={seekbarCoordinates}
          onScrollViewEnableOrDisable={setScrollViewEnabled}
        >
          <View style={{ width, backgroundColor: 'yellow', height: height }}>
            <MeasurePlayerSeekbar onMeasured={setSeekbarCoordinates}>
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
            </MeasurePlayerSeekbar>
          </View>
        </ScrollViewController>
        <View
          key="sampleScreen3"
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
