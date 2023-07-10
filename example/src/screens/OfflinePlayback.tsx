import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  OfflineContentManager,
  OfflineContentOptions,
  OfflineDownloadRequest,
  OfflineOptionEntryState,
  PlayerView,
  SourceConfig,
  SourceType,
  usePlayer,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import OfflineManagementView from '../components/OfflineManagementView';

const STABLE_IDENTIFIER = 'aStableOfflineId';

function prettyPrint(header: string, obj: any) {
  console.log(header, JSON.stringify(obj, null, 2));
}

const Action = ({
  onPress,
  text,
}: {
  onPress?: () => void;
  text: string | number;
}) => {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <Text style={styles.actionText}>{text}</Text>
    </TouchableOpacity>
  );
};

const INITIAL_DOWNLOAD_REQUEST: OfflineDownloadRequest = {
  minimumBitrate: 800000,
  audioOptionIds: [],
  textOptionIds: [],
};

const SOURCE_CONFIG: SourceConfig = {
  url: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  type: SourceType.HLS,
  title: 'Some Title',
  poster: 'https://bitmovin-a.akamaihd.net/content/sintel/poster.png',
};

export default function OfflinePlayback() {
  useTVGestures();
  const [offlineManager, setOfflineManager] = useState<OfflineContentManager>();
  const [entryState, setEntryState] = useState<OfflineOptionEntryState>();
  const [offlineOptions, setOfflineOptions] = useState<OfflineContentOptions>();
  const [progress, setProgress] = useState<number>(0);
  const [downloadRequest, setDownloadRequest] =
    useState<OfflineDownloadRequest>(INITIAL_DOWNLOAD_REQUEST);

  const onEvent = useCallback((event: any) => {
    prettyPrint(`EVENT`, event);
  }, []);

  const player = usePlayer();

  useFocusEffect(useCallback(() => () => player.destroy(), [player]));

  useFocusEffect(
    useCallback(() => {
      const newOfflineManager = new OfflineContentManager({
        identifier: STABLE_IDENTIFIER,
        sourceConfig: SOURCE_CONFIG,
        listener: {
          onCompleted: (e) => {
            onEvent(e);
            setEntryState(e.state);
            setOfflineOptions(e.options);
          },
          onError: onEvent,
          onProgress: (e) => {
            onEvent(e);
            setProgress(e.progress);
          },
          onDrmLicenseUpdated: onEvent,
          onOptionsAvailable: (e) => {
            onEvent(e);
            setEntryState(e.state);
            setOfflineOptions(e.options);
          },
          onResumed: onEvent,
          onSuspended: onEvent,
        },
      });

      newOfflineManager
        .initialize()
        .then(() => {
          setOfflineManager(newOfflineManager);
        })
        .catch(console.error);

      return () => {
        newOfflineManager.destroy?.();
        setOfflineManager(undefined);
      };
    }, [onEvent])
  );

  return (
    <View style={styles.container}>
      <PlayerView player={player} style={styles.player} />
      <View style={styles.actionsContainer}>
        <Action text={'Get Options'} onPress={offlineManager?.getOptions} />
        <Action
          text={'Process'}
          onPress={() => {
            if (downloadRequest) {
              offlineManager?.process(downloadRequest).catch(console.error);
              setDownloadRequest(INITIAL_DOWNLOAD_REQUEST);
            }
          }}
        />
        <Action text={'Delete All'} onPress={offlineManager?.deleteAll} />
        <Action text={'Suspend'} onPress={offlineManager?.suspend} />
        <Action text={'Resume'} onPress={offlineManager?.resume} />
        <Action
          text={'Load Player Video'}
          onPress={() => {
            offlineManager
              ?.getOfflineSourceConfig?.()
              ?.then?.((sourceConfig) => {
                onEvent({
                  type: 'getOfflineSourceConfig',
                  sourceConfig,
                });
                if (sourceConfig != null) {
                  onEvent('Loading the offline video');
                  player.loadOfflineSource(offlineManager);
                } else {
                  onEvent('Loading the standard source configuration');
                  player.load(SOURCE_CONFIG);
                }
              });
          }}
        />
        <Action text={`${entryState} - ${progress}`} />
      </View>
      <ScrollView style={styles.offlineOptionsContainer}>
        <OfflineManagementView
          entryState={entryState}
          offlineOptions={offlineOptions}
          downloadRequest={downloadRequest}
          setDownloadRequest={setDownloadRequest}
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
  actionsContainer: {
    flex: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    alignSelf: 'stretch',
    borderBottomColor: 'black',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  action: {
    minWidth: 100,
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightColor: 'black',
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    color: 'black',
  },
  offlineOptionsContainer: {
    flex: 1,
    backgroundColor: 'white',
    alignSelf: 'stretch',
    width: '100%',
  },
});
