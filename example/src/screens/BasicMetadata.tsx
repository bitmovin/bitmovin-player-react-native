import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Event,
  usePlayer,
  PlayerView,
  SourceType,
  MetadataType,
  MetadataParsedEvent,
  MetadataEvent,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

export default function BasicMetadata() {
  useTVGestures();

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
    // Remember to enable this to detect SCTE metadata on iOS.
    // (not necessary in this sample since metadata is ID3)
    // tweaksConfig: {
    //   isNativeHlsParsingEnabled: true,
    // }
  });

  useFocusEffect(
    useCallback(() => {
      player.load({
        url: 'https://cdn.bitmovin.com/content/internal/assets/metadata/media.m3u8',
        type: SourceType.HLS,
        title: 'ID3 Metadata Sample'
      });
      return () => {
        player.destroy();
      };
    }, [player])
  );

  const onReady = useCallback((event: Event) => {
    prettyPrint(`EVENT [${event.name}]`, event);
  }, []);

  const onMetadataEvent = useCallback(
    (event: MetadataParsedEvent | MetadataEvent) => {
      prettyPrint(`EVENT [${event.name}]`, event);

      switch (event.metadataType) {
        case MetadataType.ID3: {
          // All entries are Id3MetadataEntry here
          event.metadata.entries.forEach((entry) => {
            if (entry.platform === 'android') {
              // Android entries have frameType property
              console.log('Android ID3 frame:', entry.frameType);
            } else if (entry.platform === 'ios') {
              // iOS entries have interpreted/typed values.
              console.log('iOS ID3 id/value:', entry.id, entry.value ?? entry.rawValue);
            }
          });
          break;
        }

        case MetadataType.DATERANGE: {
          // All entries are DateRangeMetadataEntry here
          event.metadata.entries.forEach((entry) => {
            console.log('Date range ID:', entry.id);
          });
          break;
        }

        case MetadataType.SCTE: {
          // All entries are ScteMetadataEntry here
          event.metadata.entries.forEach((entry) => {
            console.log('SCTE:', entry.key, entry.value);
          });
          break;
        }
      }
    },
    []
  );

  return (
    <View style={styles.container}>
      <PlayerView
        player={player}
        style={styles.player}
        onMetadata={onMetadataEvent}
        onMetadataParsed={onMetadataEvent}
        onReady={onReady}
      />
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
