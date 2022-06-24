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

function setPlayer(node: number | null, player: Player) {
  const setPlayerCommand =
    UIManager.getViewManagerConfig('NativePlayerView').Commands.setPlayer;
  UIManager.dispatchViewManagerCommand(node, setPlayerCommand, [player.id]);
}

const styles = StyleSheet.create({
  baseStyle: {
    alignSelf: 'stretch',
  },
});

export function PlayerView(props: PlayerViewProps) {
  const nativeView = useRef(null);
  const style = StyleSheet.flatten([styles.baseStyle, props.style]);

  useEffect(() => {
    setPlayer(findNodeHandle(nativeView.current), props.player);
    return () => props.player.destroy();
  }, [props.player]);

  const _onEvent = useProxy(props.onEvent);
  const _onPlayerActive = useProxy(props.onPlayerActive);
  const _onPlayerError = useProxy(props.onPlayerError);
  const _onPlayerWarning = useProxy(props.onPlayerWarning);
  const _onDestroy = useProxy(props.onDestroy);
  const _onMuted = useProxy(props.onMuted);
  const _onUnmuted = useProxy(props.onUnmuted);
  const _onReady = useProxy(props.onReady);
  const _onPaused = useProxy(props.onPaused);
  const _onPlay = useProxy(props.onPlay);
  const _onPlaying = useProxy(props.onPlaying);
  const _onPlaybackFinished = useProxy(props.onPlaybackFinished);
  const _onSeek = useProxy(props.onSeek);
  const _onSeeked = useProxy(props.onSeeked);
  const _onTimeChanged = useProxy(props.onTimeChanged);
  const _onSourceLoad = useProxy(props.onSourceLoad);
  const _onSourceLoaded = useProxy(props.onSourceLoaded);
  const _onSourceUnloaded = useProxy(props.onSourceUnloaded);
  const _onSourceError = useProxy(props.onSourceError);
  const _onSourceWarning = useProxy(props.onSourceWarning);

  return (
    <NativePlayerView
      ref={nativeView}
      style={style}
      onEvent={_onEvent}
      onPlayerActive={_onPlayerActive}
      onPlayerError={_onPlayerError}
      onPlayerWarning={_onPlayerWarning}
      onDestroy={_onDestroy}
      onMuted={_onMuted}
      onUnmuted={_onUnmuted}
      onReady={_onReady}
      onPaused={_onPaused}
      onPlay={_onPlay}
      onPlaying={_onPlaying}
      onPlaybackFinished={_onPlaybackFinished}
      onSeek={_onSeek}
      onSeeked={_onSeeked}
      onTimeChanged={_onTimeChanged}
      onSourceLoad={_onSourceLoad}
      onSourceLoaded={_onSourceLoaded}
      onSourceUnloaded={_onSourceUnloaded}
      onSourceError={_onSourceError}
      onSourceWarning={_onSourceWarning}
    />
  );
}
