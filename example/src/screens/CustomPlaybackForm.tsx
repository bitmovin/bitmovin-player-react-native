import React, { useReducer } from 'react';
import { View, Platform, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { SourceType } from 'bitmovin-player-react-native';
import { RootStackParamsList } from '../App';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormPicker from '../components/FormPicker';
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
  streamType:
    Platform.OS === 'ios'
      ? { label: 'HLS', value: SourceType.HLS }
      : { label: 'Dash', value: SourceType.DASH },
  playDisabled: true,
};

type CustomPlaybackFormProps = NativeStackScreenProps<
  RootStackParamsList,
  'CustomPlaybackForm'
>;

const CustomPlaybackForm: React.FC<CustomPlaybackFormProps> = ({
  navigation,
}) => {
  const headerHeight = useHeaderHeight();
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <View style={styles.form}>
        <FormInput
          textContentType="password"
          title="License key"
          value={state.licenseKey}
          onChange={(value) => dispatch(setLicenseKey(value))}
          placeholder="Your license key from the dashboard"
        />
        <FormInput
          textContentType="URL"
          title="Stream URL"
          value={state.streamURL}
          onChange={(value) => dispatch(setStreamURL(value))}
          placeholder="URL path of a .m3u8, .mpd, or .mp4 file"
        />
        <FormPicker
          title="Stream type"
          options={[
            Platform.select({
              ios: {
                label: 'HLS',
                value: SourceType.HLS,
              },
              android: {
                label: 'Dash',
                value: SourceType.DASH,
              },
            })!,
            {
              label: 'Progressive',
              value: SourceType.PROGRESSIVE,
            },
          ]}
          selected={state.streamType.value}
          onChange={(value) => dispatch(setStreamType(value as SourceType))}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          type="solid"
          title="Play"
          disabled={state.playDisabled}
          containerStyle={styles.button}
          onPress={() => navigation.navigate('CustomPlayback', { ...state })}
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
