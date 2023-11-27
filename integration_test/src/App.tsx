import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

function App(): JSX.Element {
  console.info(`
To execute tests, run one of the following commands:
- Run on iOS:
  yarn integration-test test:ios

- Run on Android:
  yarn integration-test test:android
  `);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>
        To execute tests, run one of the following commands:{'\n'}
      </Text>
      <Text style={styles.instructions}>
        - Run on iOS:{'\n'}
        <Text style={styles.code}>yarn integration-test test:ios</Text>
      </Text>
      <Text style={styles.spacer}>{'\n'}</Text>
      <Text style={styles.instructions}>
        - Run on Android:{'\n'}
        <Text style={styles.code}>yarn integration-test test:android</Text>
      </Text>
      <Text style={styles.spacer}>{'\n'}</Text>
      <Text style={styles.note}>Note: See console for copy-ready commands</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    margin: 16,
  },
  headerText: {
    fontSize: 30,
    color: Colors.darker,
  },
  instructions: {
    fontSize: 24,
    color: Colors.darker,
  },
  code: {
    fontSize: 20,
    color: 'gray',
    fontStyle: 'italic',
  },
  note: {
    fontSize: 14,
    color: 'gray',
  },
  spacer: {
    height: 10,
  },
});

export default App;
