import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BasicDRMPlayback() {
  return (
    <View style={styles.container}>
      <Text style={styles.warningText}>
        This feature is currently a work in progress 🚧
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  warningText: {
    fontSize: 20,
  },
});
