import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

function App(): JSX.Element {
  console.info(`
To execute tests, run one of the following commands:
- Run on iOS:
  yarn integration-test playertest:ios

- Run on Android:
  yarn integration-test playertest:android
  `);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerText}>
        To execute tests, run one of the following commands:{'\n'}
      </Text>
      <Text style={styles.instructionsText}>
        - Run on iOS:{'\n'}
        <Text style={styles.code}>yarn integration-test playertest:ios</Text>
      </Text>
      <Text style={styles.spacer}>{'\n'}</Text>
      <Text style={styles.instructionsText}>
        - Run on Android:{'\n'}
        <Text style={styles.code}>
          yarn integration-test playertest:android
        </Text>
      </Text>
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
  instructionsText: {
    fontSize: 24,
    color: Colors.darker,
  },
  code: {
    fontSize: 20,
    color: 'gray',
    fontStyle: 'italic',
  },
  spacer: {
    height: 10,
  },
});

export default App;
