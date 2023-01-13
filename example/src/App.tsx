import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SourceType } from 'bitmovin-player-react-native';
import Button from './components/Button';
import ExamplesList from './screens/ExamplesList';
import BasicAds from './screens/BasicAds';
import BasicAnalytics from './screens/BasicAnalytics';
import BasicPlayback from './screens/BasicPlayback';
import BasicDrmPlayback from './screens/BasicDrmPlayback';
import SubtitlePlayback from './screens/SubtitlePlayback';
import CustomPlaybackForm from './screens/CustomPlaybackForm';
import CustomPlayback from './screens/CustomPlayback';
import BasicPictureInPicture from './screens/BasicPictureInPicture';
import CustomHtmlUI from './screens/CustomHtmlUI';
import BasicFullscreenHandling from './screens/BasicFullscreenHandling';

export type RootStackParamsList = {
  ExamplesList: {
    data: {
      title: string;
      routeName: keyof RootStackParamsList;
    }[];
  };
  BasicAds: undefined;
  BasicAnalytics: undefined;
  BasicPlayback: undefined;
  BasicDrmPlayback: undefined;
  BasicPictureInPicture: undefined;
  BasicFullscreenHandling: undefined;
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
  CustomHtmlUI: undefined;
};

const RootStack = createNativeStackNavigator();

export default function App() {
  var stackParams = {
    data: [
      {
        title: 'Basic playback',
        routeName: 'BasicPlayback',
      },
      {
        title: 'Basic Analytics',
        routeName: 'BasicAnalytics',
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
        title: 'Basic Picture in Picture',
        routeName: 'BasicPictureInPicture',
      },
      {
        title: 'Basic Ads',
        routeName: 'BasicAds',
      },
    ],
  };

  if (!Platform.isTVOS) {
    stackParams.data.push({
      title: 'Custom HTML UI',
      routeName: 'CustomHtmlUI',
    });
  }

  if (!Platform.isTV) {
    stackParams.data.push({
      title: 'Basic Fullscreen handling',
      routeName: 'BasicFullscreenHandling',
    });
  }

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
          initialParams={stackParams}
        />
        <RootStack.Screen
          name="BasicAds"
          component={BasicAds}
          options={{ title: 'Basic Ads' }}
        />
        <RootStack.Screen
          name="BasicAnalytics"
          component={BasicAnalytics}
          options={{ title: 'Basic Analytics' }}
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
          name="CustomPlaybackForm"
          component={CustomPlaybackForm}
          options={{ title: 'Custom playback' }}
        />
        <RootStack.Screen
          name="CustomPlayback"
          component={CustomPlayback}
          options={{ title: 'Custom playback' }}
        />
        <RootStack.Screen
          name="BasicPictureInPicture"
          component={BasicPictureInPicture}
          options={{ title: 'Basic Picture in Picture' }}
        />
        {!Platform.isTVOS && (
          <RootStack.Screen
            name="CustomHtmlUI"
            component={CustomHtmlUI}
            options={{ title: 'Custom HTML UI' }}
          />
        )}
        {!Platform.isTV && (
          <RootStack.Screen
            name="BasicFullscreenHandling"
            component={BasicFullscreenHandling}
            options={{ title: 'Basic Fullscreen Handling' }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
