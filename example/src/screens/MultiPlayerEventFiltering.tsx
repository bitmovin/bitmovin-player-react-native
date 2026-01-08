import React, { useCallback, useRef, useState } from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  PlayerView,
  SourceType,
  TimeChangedEvent,
  usePlayer,
} from 'bitmovin-player-react-native';

type EventSummary = {
  name: string;
  count: number;
};

const initialSummary: EventSummary = { name: '-', count: 0 };

export default function MultiPlayerEventFiltering() {
  const playerA = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
    playbackConfig: {
      isAutoplayEnabled: true,
    },
  });

  const playerB = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
    playbackConfig: {
      isAutoplayEnabled: true,
    },
  });

  const [eventA, setEventA] = useState<EventSummary>(initialSummary);
  const [eventB, setEventB] = useState<EventSummary>(initialSummary);
  const [timeA, setTimeA] = useState<number | null>(null);
  const [timeB, setTimeB] = useState<number | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);
  const lastTimeUpdateA = useRef(0);
  const lastTimeUpdateB = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const sourceA = {
        url:
          Platform.OS === 'ios'
            ? 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8'
            : 'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Art of Motion',
        poster:
          'https://cdn.bitmovin.com/content/internal/assets/MI201109210084/poster.jpg',
        metadata: { label: 'Player A' },
      };

      const sourceB = {
        url:
          Platform.OS === 'ios'
            ? 'https://cdn.bitmovin.com/content/internal/assets/sintel/hls/playlist.m3u8'
            : 'https://cdn.bitmovin.com/content/internal/assets/sintel/sintel.mpd',
        type: Platform.OS === 'ios' ? SourceType.HLS : SourceType.DASH,
        title: 'Sintel',
        poster: 'https://cdn.bitmovin.com/content/internal/assets/sintel/poster.png',
        metadata: { label: 'Player B' },
      };

      playerA.load(sourceA);
      playerB.load(sourceB);

      return () => {
        playerA.destroy();
        playerB.destroy();
      };
    }, [playerA, playerB])
  );

  const onEventA = useCallback((event: Event) => {
    if (event.name === 'TimeChanged') {
      return;
    }
    console.log(`[Player A] ${event.name}`, event);
    setEventA((prev) => ({
      name: event.name,
      count: prev.count + 1,
    }));
  }, []);

  const onEventB = useCallback((event: Event) => {
    if (event.name === 'TimeChanged') {
      return;
    }
    console.log(`[Player B] ${event.name}`, event);
    setEventB((prev) => ({
      name: event.name,
      count: prev.count + 1,
    }));
  }, []);

  const onTimeChangedA = useCallback((event: TimeChangedEvent) => {
    const now = Date.now();
    if (now - lastTimeUpdateA.current < 1000) {
      return;
    }
    lastTimeUpdateA.current = now;
    setTimeA(event.currentTime);
  }, []);

  const onTimeChangedB = useCallback((event: TimeChangedEvent) => {
    const now = Date.now();
    if (now - lastTimeUpdateB.current < 1000) {
      return;
    }
    lastTimeUpdateB.current = now;
    setTimeB(event.currentTime);
  }, []);

  const toggleSwap = useCallback(() => {
    setIsSwapped((prev) => !prev);
    setEventA(initialSummary);
    setEventB(initialSummary);
    setTimeA(null);
    setTimeB(null);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.note}>
        Two players run side-by-side. Each event panel should only show events
        from its own player.
      </Text>
      <View style={styles.controls}>
        <Button
          title={isSwapped ? 'Restore players' : 'Swap players'}
          onPress={toggleSwap}
        />
      </View>
      <View style={styles.playerBlock}>
        <Text style={styles.title}>Player A</Text>
        <PlayerView
          player={isSwapped ? playerB : playerA}
          style={styles.player}
          onEvent={onEventA}
          onTimeChanged={onTimeChangedA}
        />
        <View style={styles.eventPanel}>
          <Text style={styles.eventText}>Last event: {eventA.name}</Text>
          <Text style={styles.eventText}>Event count: {eventA.count}</Text>
          <Text style={styles.eventText}>
            Time: {timeA != null ? timeA.toFixed(1) : '-'}
          </Text>
        </View>
      </View>
      <View style={styles.playerBlock}>
        <Text style={styles.title}>Player B</Text>
        <PlayerView
          player={isSwapped ? playerA : playerB}
          style={styles.player}
          onEvent={onEventB}
          onTimeChanged={onTimeChangedB}
        />
        <View style={styles.eventPanel}>
          <Text style={styles.eventText}>Last event: {eventB.name}</Text>
          <Text style={styles.eventText}>Event count: {eventB.count}</Text>
          <Text style={styles.eventText}>
            Time: {timeB != null ? timeB.toFixed(1) : '-'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 12,
  },
  note: {
    color: 'white',
    marginBottom: 8,
  },
  controls: {
    marginBottom: 12,
  },
  playerBlock: {
    flex: 1,
    marginBottom: 12,
  },
  title: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 6,
  },
  player: {
    flex: 1,
    minHeight: 160,
  },
  eventPanel: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#111',
  },
  eventText: {
    color: 'white',
  },
});
