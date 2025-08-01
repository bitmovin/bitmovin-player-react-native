import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SimplePicker, { SimplePickerOption } from './SimplePicker';

export interface FormPickerProps<T = any> {
  title: string;
  options: { label: string; value: T }[];
  selected?: T;
  onChange?: (value: T, index: number) => void;
}

export default function FormPicker<T = any>({
  title,
  options,
  selected,
  onChange,
}: FormPickerProps<T>) {
  const simplePickerOptions: SimplePickerOption<T>[] = options.map(
    (option) => ({
      label: option.label,
      value: option.value,
    })
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <SimplePicker
        options={simplePickerOptions}
        selectedValue={selected}
        onValueChange={onChange}
        placeholder={`Select ${title.toLowerCase()}`}
        style={styles.picker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 500,
    alignSelf: 'stretch',
    marginTop: 20,
  },
  title: {
    color: '#000',
    marginLeft: 10,
    marginBottom: 10,
    fontWeight: '500',
    fontSize: 16,
  },
  picker: {},
});
