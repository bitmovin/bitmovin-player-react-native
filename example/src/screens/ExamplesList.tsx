import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { RootStackParamsList } from '../App';

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

const ExamplesList: React.FC<ExamplesListProps> = ({ route, navigation }) => (
  <FlatList
    data={route.params.data}
    style={styles.examplesList}
    keyExtractor={({ routeName }) => routeName}
    renderItem={({ item }) => (
      <ExampleItem
        title={item.title}
        onPress={() => {
          navigation.navigate(item.routeName);
        }}
      />
    )}
    ListHeaderComponent={Separator}
    ListFooterComponent={Separator}
    ItemSeparatorComponent={Separator}
  />
);

export default ExamplesList;

const styles = StyleSheet.create({
  examplesList: {
    flex: 1,
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
