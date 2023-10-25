import {
  OfflineContentOptions,
  OfflineDownloadRequest,
  OfflineContentOptionEntry,
} from 'bitmovin-player-react-native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React, { Dispatch, SetStateAction } from 'react';

interface Props {
  offlineOptions?: OfflineContentOptions;
  downloadRequest?: OfflineDownloadRequest;
  setDownloadRequest: Dispatch<SetStateAction<OfflineDownloadRequest>>;
}

const OfflineOption = ({
  type,
  option,
  selectedToDownload,
  onPress,
}: {
  type: string;
  option: OfflineContentOptionEntry;
  selectedToDownload?: boolean;
  onPress: () => void;
  children?: any;
}) => {
  return (
    <TouchableOpacity
      key={option.id}
      style={styles.optionContainer}
      onPress={onPress}
    >
      <Text style={styles.optionText}>
        {type} - {option.id}
        {selectedToDownload ? ` - Awaiting Download Process` : ''}
      </Text>
      <Text style={styles.optionText}>Language: {option.language}</Text>
    </TouchableOpacity>
  );
};

export default function OfflineManagementView({
  offlineOptions,
  downloadRequest,
  setDownloadRequest,
}: Props) {
  if (!offlineOptions) {
    return null;
  }

  return (
    <>
      <Text style={styles.headerText}>
        Select Audio and Subtitle Tracks to Download
      </Text>
      {offlineOptions.audioOptions.map((o) => (
        <OfflineOption
          key={o.id}
          type={'Audio'}
          option={o}
          onPress={() => {
            setDownloadRequest((prev) => {
              const prevAudioOptionIds = prev.audioOptionIds || [];
              if (prevAudioOptionIds.indexOf(o.id) !== -1) {
                return {
                  ...prev,
                  audioOptionIds: prevAudioOptionIds.filter(
                    (id) => id !== o.id
                  ),
                };
              } else {
                return {
                  ...prev,
                  audioOptionIds: [...prevAudioOptionIds, o.id],
                };
              }
            });
          }}
          selectedToDownload={downloadRequest?.audioOptionIds?.includes(o.id)}
        />
      ))}
      {offlineOptions.textOptions.map((o) => (
        <OfflineOption
          key={o.id}
          type={'Subtitle'}
          option={o}
          onPress={() => {
            setDownloadRequest((prev) => {
              const prevTextOptionIds = prev.textOptionIds || [];
              if (prevTextOptionIds.indexOf(o.id) !== -1) {
                return {
                  ...prev,
                  textOptionIds: prevTextOptionIds.filter((id) => id !== o.id),
                };
              } else {
                return {
                  ...prev,
                  textOptionIds: [...prevTextOptionIds, o.id],
                };
              }
            });
          }}
          selectedToDownload={downloadRequest?.textOptionIds?.includes(o.id)}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    padding: 12,
    borderBottomColor: 'black',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    padding: 12,
  },
  optionText: {
    color: 'black',
  },
});
