import React from 'react';
import { Tester, TestHookStore } from 'cavy';
import Specs from '../tests';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const testHookStore = new TestHookStore();

function TestableApp(): JSX.Element {
  return (
    <Tester specs={Specs} store={testHookStore}>
      <View style={styles.container}>
        <Text style={styles.text}>Tests will come here</Text>
      </View>
    </Tester>
  );
}

export default TestableApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    fontSize: 24,
    color: Colors.darker,
  },
});
