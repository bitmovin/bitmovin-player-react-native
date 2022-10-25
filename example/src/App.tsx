import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SourceType } from 'bitmovin-player-react-native';
import Button from './components/Button';
import ExamplesList from './screens/ExamplesList';
import BasicPlayback from './screens/BasicPlayback';
import BasicDrmPlayback from './screens/BasicDrmPlayback';
import SubtitlePlayback from './screens/SubtitlePlayback';
import ProgrammaticTrackSelection from './screens/ProgrammaticTrackSelection';
import CustomPlaybackForm from './screens/CustomPlaybackForm';
import CustomPlayback from './screens/CustomPlayback';

export type RootStackParamsList = {
  ExamplesList: {
    data: {
      title: string;
      routeName: keyof RootStackParamsList;
    }[];
  };
  BasicPlayback: undefined;
  BasicDrmPlayback: undefined;
  SubtitlePlayback: undefined;
  CustomPlaybackForm: undefined;
  CustomPlayback: {
    licenseKey: string;
    streamURL: string;
    streamType: {
      label: string;
      value: SourceType;
    };
  };
};

const RootStack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: !Platform.isTV,
        }}
        initialRouteName="ExamplesList"
      >
        <RootStack.Screen
          name="ExamplesList"
          component={ExamplesList}
          options={({ navigation }) => ({
            title: 'Examples',
            // eslint-disable-next-line react/no-unstable-nested-components
            headerRight: () => (
              <Button
                title="Custom"
                onPress={() => {
                  navigation.navigate('CustomPlaybackForm');
                }}
              />
            ),
          })}
          initialParams={{
            data: [
              {
                title: 'Basic playback',
                routeName: 'BasicPlayback',
              },
              {
                title: 'Basic Drm playback',
                routeName: 'BasicDrmPlayback',
              },
              {
                title: 'Subtitle and captions',
                routeName: 'SubtitlePlayback',
              },
              {
                title: 'Programmatic Track Selection',
                routeName: 'ProgrammaticTrackSelection',
              },
            ],
          }}
        />
        <RootStack.Screen
          name="BasicPlayback"
          component={BasicPlayback}
          options={{ title: 'Basic playback' }}
        />
        <RootStack.Screen
          name="BasicDrmPlayback"
          component={BasicDrmPlayback}
          options={{ title: 'Basic Drm playback' }}
        />
        <RootStack.Screen
          name="SubtitlePlayback"
          component={SubtitlePlayback}
          options={{ title: 'Subtitle and captions' }}
        />
        <RootStack.Screen
          name="ProgrammaticTrackSelection"
          component={ProgrammaticTrackSelection}
          options={{ title: 'Programmatic Track Selection' }}
        />
        <RootStack.Screen
          name="CustomPlaybackForm"
          component={CustomPlaybackForm}
          options={{ title: 'Custom playback' }}
        />
        <RootStack.Screen
          name="CustomPlayback"
          component={CustomPlayback}
          options={{ title: 'Custom playback' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
