import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BasicPlayback from './screens/BasicPlayback';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Basic Playback" component={BasicPlayback} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
