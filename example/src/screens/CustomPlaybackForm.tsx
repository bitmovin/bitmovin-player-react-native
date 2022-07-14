import React, { useState, useReducer } from 'react';
import { View, Platform, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';
import { SourceType } from 'bitmovin-player-react-native';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { capitalize } from '../utils';

enum FormAction {
  SET_LICENSE_KEY = 'SET_LICENSE_KEY',
  SET_STREAM_URL = 'SET_STREAM_URL',
  SET_STREAM_TYPE = 'SET_STREAM_TYPE',
}

interface Action {
  type: FormAction;
  payload: any;
}

interface StreamType {
  label: string;
  value: SourceType;
}

interface State {
  licenseKey: string;
  streamURL: string;
  streamType: StreamType;
  playDisabled: boolean;
}

function formReducer(state: State, action: Action): State {
  const { type, payload } = action;
  let newState = state;

  switch (type) {
    case FormAction.SET_LICENSE_KEY:
      newState = { ...newState, licenseKey: payload as string };
      break;
    case FormAction.SET_STREAM_URL:
      newState = { ...newState, streamURL: payload as string };
      break;
    case FormAction.SET_STREAM_TYPE:
      newState = { ...newState, streamType: payload as StreamType };
      break;
  }

  // update play button state based on fufilled inputs
  const { licenseKey, streamURL } = newState;
  newState = {
    ...newState,
    playDisabled: !(licenseKey.length && streamURL.length),
  };

  return newState;
}

// action creators
const setLicenseKey = (payload: string): Action => ({
  type: FormAction.SET_LICENSE_KEY,
  payload,
});

const setStreamURL = (payload: string): Action => ({
  type: FormAction.SET_STREAM_URL,
  payload,
});

const setStreamType = (value: SourceType): Action => ({
  type: FormAction.SET_STREAM_TYPE,
  payload: {
    value,
    label: value === SourceType.HLS ? 'HLS' : capitalize(value),
  },
});

// initial state
const initialFormState = {
  licenseKey: '',
  streamURL: '',
  streamType: {
    label: 'HLS',
    value: SourceType.HLS,
  },
  playDisabled: true,
};

const CustomPlaybackForm = () => {
  const headerHeight = useHeaderHeight();
  const [isModalVisible, setModalVisible] = useState(false);
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.form}>
        <FormInput
          title="License key"
          value={state.licenseKey}
          onChange={(value) => dispatch(setLicenseKey(value))}
          placeholder="Paste your license key from dashboard"
        />
        <FormInput
          title="Stream URL"
          value={state.streamURL}
          onChange={(value) => dispatch(setStreamURL(value))}
          placeholder="e.g. https://example.com/resource.m3u8"
        />
        <FormInput
          editable={false}
          title="Stream type"
          value={state.streamType.label}
          onPress={() => setModalVisible(true)}
        />
      </View>
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <Picker
            selectedValue={state.streamType.value}
            onValueChange={(value, _) => dispatch(setStreamType(value))}
          >
            <Picker.Item label="HLS" value={SourceType.HLS} />
            <Picker.Item label="Dash" value={SourceType.DASH} />
            <Picker.Item label="Progressive" value={SourceType.PROGRESSIVE} />
          </Picker>
        </View>
      </Modal>
      <View style={styles.buttonContainer}>
        <Button
          type="solid"
          title="Play"
          onPress={() => {
            console.log('play');
          }}
          disabled={state.playDisabled}
          containerStyle={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default CustomPlaybackForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  form: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
  button: {
    height: 50,
  },
  buttonContainer: {
    margin: 20,
    alignSelf: 'stretch',
  },
  modal: {
    borderRadius: 20,
    backgroundColor: 'white',
  },
});
