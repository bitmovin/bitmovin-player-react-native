import React, { useEffect } from 'react';
import { Platform, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AudioSession, SourceType } from 'bitmovin-player-react-native';
import ExamplesList from './screens/ExamplesList';
import BasicAds from './screens/BasicAds';
import BasicAnalytics from './screens/BasicAnalytics';
import BasicPlayback from './screens/BasicPlayback';
import BasicTvPlayback from './screens/BasicTvPlayback';
import BasicDrmPlayback from './screens/BasicDrmPlayback';
import SubtitlePlayback from './screens/SubtitlePlayback';
import ProgrammaticTrackSelection from './screens/ProgrammaticTrackSelection';
import CustomPlaybackForm from './screens/CustomPlaybackForm';
import CustomPlayback from './screens/CustomPlayback';
import BasicPictureInPicture from './screens/BasicPictureInPicture';
import CustomHtmlUi from './screens/CustomHtmlUi';
import BasicFullscreenHandling from './screens/BasicFullscreenHandling';
import LandscapeFullscreenHandling from './screens/LandscapeFullscreenHandling';
import SystemUI from './screens/SystemUi';
import OfflinePlayback from './screens/OfflinePlayback';
import Casting from './screens/Casting';
import CustomUi from './screens/CustomUi';
import BackgroundPlayback from './screens/BackgroundPlayback';

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
  BasicTvPlayback: undefined;
  BasicDrmPlayback: undefined;
  CustomUi: undefined;
  BasicPictureInPicture: {
    navigation: NativeStackNavigationProp<RootStackParamsList>;
  };
  BasicFullscreenHandling: {
    navigation: NativeStackNavigationProp<RootStackParamsList>;
  };
  LandscapeFullscreenHandling: {
    navigation: NativeStackNavigationProp<RootStackParamsList>;
  };
  SubtitlePlayback: undefined;
  ProgrammaticTrackSelection: undefined;
  CustomPlaybackForm: undefined;
  OfflinePlayback: undefined;
  CustomPlayback: {
    licenseKey: string;
    streamURL: string;
    streamType: {
      label: string;
      value: SourceType;
    };
  };
  CustomHtmlUi: {
    navigation: NativeStackNavigationProp<RootStackParamsList>;
  };
  Casting: undefined;
  SystemUI: undefined;
  BackgroundPlayback: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamsList>();

const isTVOS = Platform.OS === 'ios' && Platform.isTV;
const isAndroidTV = Platform.OS === 'android' && Platform.isTV;

export default function App() {
  useEffect(() => {
    // iOS audio session category must be set to `playback` first, otherwise playback
    // will have no audio when the device is silenced.
    // This is also required to make Picture in Picture work on iOS.
    //
    // Usually it's desireable to set the audio's category only once during your app's main component
    // initialization. This way you can guarantee that your app's audio category is properly
    // configured throughout the whole lifecycle of the application.
    AudioSession.setCategory('playback').catch((error) => {
      // Handle any native errors that might occur while setting the audio's category.
      console.log("Failed to set app's audio category to `playback`:\n", error);
    });
  });

  const stackParams = {
    data: [
      {
        title: 'Basic playback',
        routeName: 'BasicPlayback' as keyof RootStackParamsList,
      },
      {
        title: 'Basic Analytics',
        routeName: 'BasicAnalytics' as keyof RootStackParamsList,
      },
      {
        title: 'Basic Drm playback',
        routeName: 'BasicDrmPlayback' as keyof RootStackParamsList,
      },
      {
        title: 'CustomUi',
        routeName: 'CustomUi' as keyof RootStackParamsList,
      },
      {
        title: 'Subtitle and captions',
        routeName: 'SubtitlePlayback' as keyof RootStackParamsList,
      },
      {
        title: 'Basic Picture in Picture',
        routeName: 'BasicPictureInPicture' as keyof RootStackParamsList,
      },
      {
        title: 'Basic Ads',
        routeName: 'BasicAds' as keyof RootStackParamsList,
      },
      {
        title: 'Programmatic Track Selection',
        routeName: 'ProgrammaticTrackSelection' as keyof RootStackParamsList,
      },
      {
        title: 'Background Playback',
        routeName: 'BackgroundPlayback' as keyof RootStackParamsList,
      },
    ],
  };

  if (isAndroidTV) {
    stackParams.data.unshift({
      title: 'Basic TV playback',
      routeName: 'BasicTvPlayback',
    });
  }

  if (!isTVOS) {
    stackParams.data.push({
      title: 'Custom HTML UI',
      routeName: 'CustomHtmlUi',
    });

    stackParams.data.push({
      title: 'Offline playback',
      routeName: 'OfflinePlayback',
    });
  }

  if (!Platform.isTV) {
    stackParams.data.push({
      title: 'Basic Fullscreen handling',
      routeName: 'BasicFullscreenHandling',
    });
    stackParams.data.push({
      title: 'Landscape Fullscreen handling',
      routeName: 'LandscapeFullscreenHandling',
    });
    stackParams.data.push({
      title: 'Casting',
      routeName: 'Casting',
    });
  }

  if (Platform.OS === 'ios' && !Platform.isTV) {
    stackParams.data.push({
      title: 'System UI',
      routeName: 'SystemUI',
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
        {isAndroidTV && (
          <RootStack.Screen
            name="BasicTvPlayback"
            component={BasicTvPlayback}
            options={{ title: 'Basic TV playback' }}
          />
        )}
        <RootStack.Screen
          name="BasicDrmPlayback"
          component={BasicDrmPlayback}
          options={{ title: 'Basic Drm playback' }}
        />
        <RootStack.Screen
          name="CustomUi"
          component={CustomUi}
          options={{ title: 'CustomUi' }}
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
        {!isTVOS && (
          <RootStack.Screen
            name="OfflinePlayback"
            component={OfflinePlayback}
            options={{ title: 'Offline Playback' }}
          />
        )}
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
          options={{
            title: 'Basic Picture in Picture',
            // eslint-disable-next-line react/no-unstable-nested-components
            headerRight: () => <Button title="Enter PiP" />,
          }}
        />
        {!isTVOS && (
          <RootStack.Screen
            name="CustomHtmlUi"
            component={CustomHtmlUi}
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
        {!Platform.isTV && (
          <RootStack.Screen
            name="LandscapeFullscreenHandling"
            component={LandscapeFullscreenHandling}
            options={{ title: 'Lanscape Fullscreen Handling' }}
          />
        )}
        {Platform.OS === 'ios' && (
          <RootStack.Screen
            name="SystemUI"
            component={SystemUI}
            options={{ title: 'System UI' }}
          />
        )}
        {!Platform.isTV && (
          <RootStack.Screen
            name="Casting"
            component={Casting}
            options={{ title: 'Casting' }}
          />
        )}
        <RootStack.Screen
          name="BackgroundPlayback"
          component={BackgroundPlayback}
          options={{ title: 'Background Playback' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
