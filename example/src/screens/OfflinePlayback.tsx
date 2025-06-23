import React, { useCallback, useMemo, useState } from 'react';
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
  OfflineState,
  PlayerView,
  SourceConfig,
  SourceType,
  usePlayer,
} from 'bitmovin-player-react-native';
import { useTVGestures } from '../hooks';
import OfflineManagementView from '../components/OfflineManagementView';

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
    <TouchableOpacity
      style={styles.action}
      onPress={onPress}
      disabled={onPress === undefined}
    >
      <Text style={styles.actionText}>{text}</Text>
    </TouchableOpacity>
  );
};

const initialDownloadRequest: OfflineDownloadRequest = {
  minimumBitrate: 800000,
};

const STABLE_CONTENT_IDENTIFIER = 'sintel-content-id';
const sourceConfig: SourceConfig = {
  url: 'https://cdn.bitmovin.com/content/internal/assets/sintel/hls/playlist.m3u8',
  type: SourceType.HLS,
  title: 'Sintel',
  poster: 'https://cdn.bitmovin.com/content/internal/assets/sintel/poster.png',
};

export default function OfflinePlayback() {
  useTVGestures();
  const [offlineContentManager, setOfflineContentManager] =
    useState<OfflineContentManager>();
  const [downloadState, setDownloadState] = useState<OfflineState>();
  const [offlineOptions, setOfflineOptions] = useState<OfflineContentOptions>();
  const [progress, setProgress] = useState<number>(0);
  const [downloadRequest, setDownloadRequest] =
    useState<OfflineDownloadRequest>(initialDownloadRequest);
  const [usedStorage, setUsedStorage] = useState<number>(0);
  const [isLoadedSourceOffline, setIsLoadedSourceOffline] =
    useState<boolean>(false);
  const stateLabel = useMemo(() => {
    offlineContentManager?.usedStorage().then((usedStorageInBytes) => {
      setUsedStorage(usedStorageInBytes / 1024 / 1024);
    });
    switch (downloadState) {
      case OfflineState.Downloading:
        return `Downloading: ${progress.toFixed(2)}%`;
      case OfflineState.Downloaded:
        return 'Downloaded';
      case OfflineState.NotDownloaded:
        return 'Not Downloaded';
      case OfflineState.Suspended:
        return `Suspended: ${progress.toFixed(2)}%`;
      default:
        return 'Unknown state';
    }
  }, [downloadState, progress, offlineContentManager]);

  const onEvent = useCallback((event: any) => {
    prettyPrint(`EVENT`, event);
  }, []);

  const player = usePlayer({
    remoteControlConfig: {
      isCastEnabled: false,
    },
  });

  useFocusEffect(useCallback(() => () => player.destroy(), [player]));

  useFocusEffect(
    useCallback(() => {
      player.load(sourceConfig);

      const newOfflineContentManager = new OfflineContentManager({
        identifier: STABLE_CONTENT_IDENTIFIER,
        sourceConfig: sourceConfig,
      });

      const removeOfflineContentManagerListener =
        newOfflineContentManager.addListener({
          onCompleted: (e) => {
            onEvent(e);
            setDownloadState(e.state);
            setOfflineOptions(e.options);
          },
          onError: (e) => {
            onEvent(e);
            setDownloadState(e.state);
          },
          onProgress: (e) => {
            onEvent(e);
            setDownloadState(e.state);
            setProgress(e.progress);
          },
          onDrmLicenseUpdated: onEvent,
          onOptionsAvailable: (e) => {
            onEvent(e);
            setDownloadState(e.state);
            setOfflineOptions(e.options);
          },
          onResumed: (e) => {
            onEvent(e);
            setDownloadState(e.state);
          },
          onSuspended: (e) => {
            onEvent(e);
            setDownloadState(e.state);
          },
          onCanceled: (e) => {
            onEvent(e);
            setDownloadState(e.state);
          },
        });

      newOfflineContentManager
        .initialize()
        .then(() => {
          setOfflineContentManager(newOfflineContentManager);
          newOfflineContentManager.state().then((state) => {
            setDownloadState(state);
          });
          newOfflineContentManager.getOptions().catch(console.error);
        })
        .catch(console.error);

      return () => {
        removeOfflineContentManagerListener();
        newOfflineContentManager.destroy();
        setOfflineContentManager(undefined);
      };
    }, [onEvent, player])
  );

  return (
    <View style={styles.container}>
      <PlayerView player={player} style={styles.player} />
      <Text style={styles.loadedState}>
        Currently loaded:{' '}
        {isLoadedSourceOffline ? 'offline content' : 'online content'}
      </Text>
      <View style={styles.actionsContainer}>
        {isLoadedSourceOffline && (
          <Action
            text={'Load online content'}
            onPress={() => {
              player.load(sourceConfig);
              setIsLoadedSourceOffline(false);
            }}
          />
        )}
        {downloadState === OfflineState.Downloaded && !isLoadedSourceOffline && (
          <Action
            text={'Load offline content'}
            onPress={() => {
              if (offlineContentManager != null) {
                onEvent('Loading the offline video');
                player.loadOfflineContent(offlineContentManager);
                setIsLoadedSourceOffline(true);
              }
            }}
          />
        )}
        {downloadState === OfflineState.NotDownloaded && (
          <Action
            text={'Download'}
            onPress={() => {
              if (downloadRequest) {
                offlineContentManager
                  ?.download(downloadRequest)
                  .catch(console.error);
                setDownloadRequest(initialDownloadRequest);
              }
            }}
          />
        )}
        {downloadState === OfflineState.Downloaded && (
          <Action
            text={'Delete all'}
            onPress={() => {
              offlineContentManager?.deleteAll().then(() => {
                setDownloadState(OfflineState.NotDownloaded);
                offlineContentManager.getOptions().catch(console.error);
                player.load(sourceConfig);
                setIsLoadedSourceOffline(false);
              });
            }}
          />
        )}
        {(downloadState === OfflineState.Downloading ||
          downloadState === OfflineState.Suspended) && (
          <Action
            text={'Cancel download'}
            onPress={offlineContentManager?.cancelDownload}
          />
        )}
        {downloadState === OfflineState.Downloading && (
          <Action
            text={'Suspend download'}
            onPress={offlineContentManager?.suspend}
          />
        )}
        {downloadState === OfflineState.Suspended && (
          <Action
            text={'Resume download'}
            onPress={offlineContentManager?.resume}
          />
        )}
        <Action text={`State: ${stateLabel}`} />
        {downloadState !== OfflineState.NotDownloaded && (
          <Action text={`Used storage: ${usedStorage.toFixed(2)} MB`} />
        )}
      </View>
      <ScrollView style={styles.offlineOptionsContainer}>
        {downloadState === OfflineState.NotDownloaded && (
          <OfflineManagementView
            offlineOptions={offlineOptions}
            downloadRequest={downloadRequest}
            setDownloadRequest={setDownloadRequest}
          />
        )}
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
    maxHeight: '30%',
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
    minWidth: 120,
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
  loadedState: {
    flex: 0,
    fontSize: 16,
    backgroundColor: 'white',
    alignSelf: 'stretch',
    justifyContent: 'center',
    padding: 12,
    textAlign: 'center',
  },
});
