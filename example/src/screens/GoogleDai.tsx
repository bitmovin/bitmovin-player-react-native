import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Player, PlayerView } from 'bitmovin-player-react-native';
import type { Event } from 'bitmovin-player-react-native';
import {
  GoogleDaiSourceType,
  withGoogleDai,
} from '@bitmovin/player-react-native-google-dai';
import Button from '../components/Button';

const liveDaiConfig = {
  kind: 'live' as const,
  assetKey: 'c-rArva4ShKVIAkNfy6HUQ',
  networkCode: '21775744923',
  type: GoogleDaiSourceType.HLS,
};

function prettyPrint(header: string, obj: unknown) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function GoogleDai() {
  const playerViewRef = useRef(null);
  const [status, setStatus] = useState('Mount the PlayerView, then load DAI.');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const player = useMemo(
    () =>
      withGoogleDai(
        new Player({
          playbackConfig: {
            isAutoplayEnabled: true,
          },
          remoteControlConfig: {
            isCastEnabled: false,
          },
        })
      ),
    []
  );

  useEffect(() => {
    return () => player.destroy();
  }, [player]);

  const onEvent = useCallback((event: Event) => {
    prettyPrint(`[Google DAI] ${event.name}`, event);
  }, []);

  const loadGoogleDai = useCallback(async () => {
    if (playerViewRef.current == null) {
      setStatus('PlayerView is still attaching. Try again in a moment.');
      return;
    }

    setIsLoading(true);
    setStatus('Loading Google DAI live stream...');
    try {
      await player.googleDai.load(liveDaiConfig);
      player.play();
      setHasLoaded(true);
      setStatus('Google DAI live stream loaded. Watch logs for ad events.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Google DAI load failed: ${message}`);
      console.warn('[Google DAI] load failed', error);
    } finally {
      setIsLoading(false);
    }
  }, [player]);

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        viewRef={playerViewRef}
        style={styles.player}
        onAdBreakFinished={onEvent}
        onAdBreakStarted={onEvent}
        onAdClicked={onEvent}
        onAdError={onEvent}
        onAdFinished={onEvent}
        onAdQuartile={onEvent}
        onAdSkipped={onEvent}
        onAdStarted={onEvent}
        onPlayerError={onEvent}
        onPlaying={onEvent}
        onReady={onEvent}
        onSourceLoaded={onEvent}
      />
      <View style={styles.controls}>
        <Text style={styles.title}>Google IMA DAI</Text>
        <Text style={styles.description}>{status}</Text>
        <Button
          title={hasLoaded ? 'DAI Loaded' : 'Load Google DAI'}
          type="solid"
          disabled={isLoading || hasLoaded}
          onPress={() => {
            void loadGoogleDai();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  player: {
    flex: 1,
  },
  controls: {
    flex: 0,
    gap: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    color: 'black',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: 'black',
    fontSize: 14,
  },
});
