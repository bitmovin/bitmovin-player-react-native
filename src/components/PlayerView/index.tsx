import React, { useRef, useEffect } from 'react';
import {
  Platform,
  UIManager,
  ViewStyle,
  StyleSheet,
  findNodeHandle,
} from 'react-native';
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

function dispatch(command: string, node: number | null, playerId: string) {
  const commandId =
    Platform.OS === 'android'
      ? (UIManager as any).NativePlayerView.Commands[command].toString()
      : UIManager.getViewManagerConfig('NativePlayerView').Commands[command];
  UIManager.dispatchViewManagerCommand(
    node,
    commandId,
    Platform.select({
      ios: [playerId],
      android: [node, playerId],
    })
  );
}

export function PlayerView(props: PlayerViewProps) {
  const nativeView = useRef(null);
  const style = StyleSheet.flatten([styles.baseStyle, props.style]);
  useEffect(() => {
    const node = findNodeHandle(nativeView.current);
    dispatch('attachPlayer', node, props.player.id);
    return () => {
      dispatch('detachPlayer', node, props.player.id);
    };
  }, [props.player.id]);
  return (
    <NativePlayerView
      ref={nativeView}
      style={style}
      onEvent={useProxy(nativeView, props.onEvent)}
      onPlayerActive={useProxy(nativeView, props.onPlayerActive)}
      onPlayerError={useProxy(nativeView, props.onPlayerError)}
      onPlayerWarning={useProxy(nativeView, props.onPlayerWarning)}
      onDestroy={useProxy(nativeView, props.onDestroy)}
      onMuted={useProxy(nativeView, props.onMuted)}
      onUnmuted={useProxy(nativeView, props.onUnmuted)}
      onReady={useProxy(nativeView, props.onReady)}
      onPaused={useProxy(nativeView, props.onPaused)}
      onPlay={useProxy(nativeView, props.onPlay)}
      onPlaying={useProxy(nativeView, props.onPlaying)}
      onPlaybackFinished={useProxy(nativeView, props.onPlaybackFinished)}
      onSeek={useProxy(nativeView, props.onSeek)}
      onSeeked={useProxy(nativeView, props.onSeeked)}
      onTimeChanged={useProxy(nativeView, props.onTimeChanged)}
      onSourceLoad={useProxy(nativeView, props.onSourceLoad)}
      onSourceLoaded={useProxy(nativeView, props.onSourceLoaded)}
      onSourceUnloaded={useProxy(nativeView, props.onSourceUnloaded)}
      onSourceError={useProxy(nativeView, props.onSourceError)}
      onSourceWarning={useProxy(nativeView, props.onSourceWarning)}
    />
  );
}
