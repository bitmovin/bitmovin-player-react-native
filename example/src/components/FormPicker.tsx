import React, { useState, useCallback } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';
import FormInput from './FormInput';

export interface FormPickerProps {
  title: string;
  options?: {
    label: string;
    value: string;
  }[];
  selected?: string;
  onChange?: (value: string) => void;
}

const Picker: React.FC<Omit<FormPickerProps, 'title'>> = ({
  options,
  selected,
  onChange,
}) => {
  const onValueChange = useCallback(
    (index: number) => {
      const value = options?.[index]?.value;
      if (value) {
        onChange?.(value);
      }
    },
    [options, onChange]
  );
  return (
    <RNPicker
      mode="dropdown"
      style={Platform.OS === 'ios' ? styles.iosPicker : styles.androidPicker}
      selectedValue={selected}
      onValueChange={(_, index) => onValueChange(index)}
    >
      {options?.map((option, index) => (
        <RNPicker.Item key={index} label={option.label} value={option.value} />
      ))}
    </RNPicker>
  );
};

const FormPicker: React.FC<FormPickerProps> = (props) => {
  const [isPickerVisible, setVisiblePicker] = useState(false);
  const selectedLabel =
    props.options?.find((opt) => opt.value === props.selected)?.label ?? '';
  return Platform.OS === 'ios' ? (
    <>
      <FormInput
        editable={false}
        title={props.title}
        value={selectedLabel}
        onPress={() => setVisiblePicker(true)}
      />
      <Modal
        isVisible={isPickerVisible}
        onBackdropPress={() => setVisiblePicker(false)}
      >
        <Picker {...props} />
      </Modal>
    </>
  ) : (
    <View style={styles.androidInput}>
      <Text style={styles.inputTitle}>{props.title}</Text>
      <Picker {...props} />
    </View>
  );
};

export default FormPicker;

const styles = StyleSheet.create({
  iosPicker: {
    color: 'black',
    borderRadius: 15,
    backgroundColor: 'white',
  },
  androidInput: {
    maxWidth: 500,
    alignSelf: 'stretch',
  },
  androidPicker: {
    color: 'white',
    height: 40,
    padding: 10,
    marginTop: 10,
    backgroundColor: 'black',
  },
  inputTitle: {
    color: 'black',
    marginTop: 20,
    marginLeft: 10,
    fontWeight: '500',
  },
});
