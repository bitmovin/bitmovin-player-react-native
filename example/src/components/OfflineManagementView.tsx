import {
  OfflineContentOptions,
  OfflineDownloadRequest,
  OfflineOptionEntry,
  OfflineOptionEntryState,
} from 'bitmovin-player-react-native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React, { Dispatch, SetStateAction } from 'react';

interface Props {
  entryState?: OfflineOptionEntryState;
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
  option: OfflineOptionEntry;
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
      <Text style={styles.optionText}>language={option.language}</Text>
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
      {offlineOptions.audioOptions.map((o) => (
        <OfflineOption
          key={o.id}
          type={'Audio'}
          option={o}
          onPress={() => {
            setDownloadRequest((prev) => ({
              ...prev,
              audioOptionIds: [...prev.audioOptionIds, o.id],
            }));
          }}
          selectedToDownload={downloadRequest?.audioOptionIds?.includes(o.id)}
        />
      ))}
      {offlineOptions.textOptions.map((o) => (
        <OfflineOption
          key={o.id}
          type={'Text'}
          option={o}
          onPress={() => {
            setDownloadRequest((prev) => ({
              ...prev,
              textOptionIds: [...prev.textOptionIds, o.id],
            }));
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
  optionText: {
    color: 'black',
  },
});
