import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExamplesList from './screens/ExamplesList';
import BasicPlayback from './screens/BasicPlayback';

export type RootStackParamsList = {
  ExamplesList: {
    data: {
      title: string;
      routeName: keyof RootStackParamsList;
    }[];
  };
  BasicPlayback: undefined;
  DRMPlayback: undefined;
  SubtitlePlayback: undefined;
  CustomPlayback: undefined;
};

const RootStack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="ExamplesList">
        <RootStack.Screen
          name="ExamplesList"
          component={ExamplesList}
          options={{ title: 'Examples' }}
          initialParams={{
            data: [
              {
                title: 'Basic Playback',
                routeName: 'BasicPlayback',
              },
              {
                title: 'DRM Playback',
                routeName: 'BasicDRMPlayback',
              },
              {
                title: 'Subtitle and captions',
                routeName: 'SubtitlePlayback',
              },
            ],
          }}
        />
        <RootStack.Screen
          name="BasicPlayback"
          component={BasicPlayback}
          options={{ title: 'Basic Playback' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
