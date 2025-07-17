import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RootStackParamsList } from '../App';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExampleItemProps {
  title: string;
  onPress: () => void;
}

const ExampleItem: React.FC<ExampleItemProps> = ({ title, onPress }) => (
  <TouchableOpacity style={styles.exampleItem} onPress={onPress}>
    <Text style={styles.exampleItemTitle}>{title}</Text>
  </TouchableOpacity>
);

const Separator = () => <View style={styles.separator} />;

type ExamplesListProps = NativeStackScreenProps<
  RootStackParamsList,
  'ExamplesList'
>;

const ExamplesList: React.FC<ExamplesListProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <FlatList
      data={route.params.data}
      style={styles.examplesList}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      keyExtractor={({ routeName }) => routeName}
      renderItem={({ item }) => (
        <ExampleItem
          title={item.title}
          onPress={() => {
            // @ts-ignore
            navigation.navigate(item.routeName);
          }}
        />
      )}
      ListHeaderComponent={Separator}
      ListFooterComponent={Separator}
      ItemSeparatorComponent={Separator}
    />
  );
};

export default ExamplesList;

const styles = StyleSheet.create({
  examplesList: {
    backgroundColor: 'white',
  },
  exampleItem: {
    height: 60,
    paddingLeft: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  exampleItemTitle: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'gray',
  },
});
