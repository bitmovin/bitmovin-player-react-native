import React, { useRef, useEffect } from 'react';
import { UIManager, ViewStyle, StyleSheet, findNodeHandle } from 'react-native';
import { PlayerViewEvents } from './events';
import { NativePlayerView } from './native';
import { Player } from '../../player';
import { useProxy } from '../../hooks/useProxy';

export interface BasePlayerViewProps {
  style?: ViewStyle;
}

export interface PlayerViewProps extends BasePlayerViewProps, PlayerViewEvents {
  player: Player;
}

const styles = StyleSheet.create({
  baseStyle: {
    alignSelf: 'stretch',
  },
});

function attachPlayer(node: number | null, player: Player) {
  const attachCommand =
    UIManager.getViewManagerConfig('NativePlayerView').Commands.attachPlayer;
  UIManager.dispatchViewManagerCommand(node, attachCommand, [player.id]);
}

export function PlayerView(props: PlayerViewProps) {
  const nativeView = useRef(null);
  const style = StyleSheet.flatten([styles.baseStyle, props.style]);
  useEffect(() => {
    attachPlayer(findNodeHandle(nativeView.current), props.player);
  }, [props.player]);
  return (
    <NativePlayerView
      ref={nativeView}
      style={style}
      onEvent={useProxy(props.onEvent)}
      onPlayerActive={useProxy(props.onPlayerActive)}
      onPlayerError={useProxy(props.onPlayerError)}
      onPlayerWarning={useProxy(props.onPlayerWarning)}
      onDestroy={useProxy(props.onDestroy)}
      onMuted={useProxy(props.onMuted)}
      onUnmuted={useProxy(props.onUnmuted)}
      onReady={useProxy(props.onReady)}
      onPaused={useProxy(props.onPaused)}
      onPlay={useProxy(props.onPlay)}
      onPlaying={useProxy(props.onPlaying)}
      onPlaybackFinished={useProxy(props.onPlaybackFinished)}
      onSeek={useProxy(props.onSeek)}
      onSeeked={useProxy(props.onSeeked)}
      onTimeChanged={useProxy(props.onTimeChanged)}
      onSourceLoad={useProxy(props.onSourceLoad)}
      onSourceLoaded={useProxy(props.onSourceLoaded)}
      onSourceUnloaded={useProxy(props.onSourceUnloaded)}
      onSourceError={useProxy(props.onSourceError)}
      onSourceWarning={useProxy(props.onSourceWarning)}
    />
  );
}
