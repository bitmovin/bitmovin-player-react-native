import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  usePlayer,
  SourceType,
  PlayerView,
  SourceConfig,
  Event,
} from 'bitmovin-player-react-native';

const source: SourceConfig = {
  // url: umarURL,
  url: 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
  type: SourceType.DASH,
};

export default function LazyLoad() {
  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
    adaptationConfig: {
      initialBandwidthEstimateOverride: 1500000,
    },
    bufferConfig: {
      startupThreshold: 0.3,
    },
  });

  useFocusEffect(
    useCallback(() => {
      console.log('Lazy load started');
      player.load(source);
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onSourceLoaded = useCallback(
    (_: Event) => {
      console.log(`Lazy Load completed`);
      player.unload();
    },
    [player]
  );

  return <PlayerView player={player} onSourceLoaded={onSourceLoaded} />;
}
