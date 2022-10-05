import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePlayer, PlayerView } from 'bitmovin-player-react-native';
import { RootStackParamsList } from '../App';
import { useTVGestures } from '../hooks';

type CustomPlaybackProps = NativeStackScreenProps<
  RootStackParamsList,
  'CustomPlayback'
>;

const CustomPlayback: React.FC<CustomPlaybackProps> = ({ route }) => {
  useTVGestures();

  const player = usePlayer({
    licenseKey: route.params?.licenseKey,
  });

  useFocusEffect(
    useCallback(() => {
      const { streamURL, streamType } = route.params;
      if (streamURL && streamType) {
        player.load({
          url: streamURL,
          type: streamType.value,
        });
      }
      return () => {
        player.destroy();
      };
    }, [player, route.params])
  );

  return (
    <View style={styles.container}>
      <PlayerView style={styles.player} player={player} />
    </View>
  );
};

export default CustomPlayback;

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
