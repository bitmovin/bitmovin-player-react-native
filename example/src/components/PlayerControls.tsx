import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  VideoSkipBack,
  VideoPause,
  VideoPlay,
  VideoSkipForward,
} from '../assets/icons';

interface Props {
  playing: boolean;
  showSkip: boolean;
  onPlay: () => void;
  onPause: () => void;
  skipForwards?: () => void;
  skipBackwards?: () => void;
}

export const PlayerControls: React.FC<Props> = ({
  playing,
  showSkip,
  onPlay,
  onPause,
  skipForwards,
  skipBackwards,
}) => (
  <View style={styles.wrapper}>
    {showSkip && (
      <TouchableOpacity style={styles.touchableEnabled} onPress={skipBackwards}>
        <VideoSkipBack />
      </TouchableOpacity>
    )}

    <TouchableOpacity
      style={styles.touchableEnabled}
      onPress={playing ? onPause : onPlay}
    >
      {playing ? <VideoPause /> : <VideoPlay />}
    </TouchableOpacity>

    {showSkip && (
      <TouchableOpacity style={styles.touchableEnabled} onPress={skipForwards}>
        <VideoSkipForward />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flex: 3,
  },
  touchableEnabled: {
    padding: 5,
    opacity: 1.0,
  },
  touchableDisabled: {
    opacity: 0.3,
  },
});
