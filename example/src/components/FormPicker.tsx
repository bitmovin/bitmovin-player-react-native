import React, { useState } from 'react';
import { View, Text, Platform, StyleSheet, Modal } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import FormInput from './FormInput';

export interface FormPickerProps<T = any> {
  title: string;
  options: { label: string; value: T }[];
  selected?: T;
  onChange?: (value: T, index: number) => void;
}

function PickerInner<T>({
  options,
  selected,
  onChange,
}: Omit<FormPickerProps<T>, 'title'>) {
  return (
    <View
      style={
        Platform.OS === 'ios'
          ? styles.iosPickerContainer
          : styles.androidPickerContainer
      }
    >
      <RNPicker
        mode="dropdown"
        selectedValue={selected}
        onValueChange={(itemValue, itemIndex) =>
          onChange?.(itemValue as T, itemIndex)
        }
        style={styles.picker}
        dropdownIconColor="#000"
      >
        {options?.map((o, idx) => (
          <RNPicker.Item
            key={`${String(o.value)}-${idx}`}
            label={o.label}
            value={o.value}
            color="#000"
          />
        ))}
      </RNPicker>
    </View>
  );
}

export default function FormPicker<T = any>(props: FormPickerProps<T>) {
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
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisiblePicker(false)}
        onDismiss={() => setVisiblePicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <PickerInner {...props} />
          </View>
        </View>
      </Modal>
    </>
  ) : (
    <View style={styles.androidInput}>
      <Text style={styles.inputTitle}>{props.title}</Text>
      <PickerInner {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  iosPickerContainer: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  androidInput: {
    maxWidth: 500,
    alignSelf: 'stretch',
  },
  androidPickerContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
    minHeight: 52,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    backgroundColor: '#fff',
    color: '#000',
  },
  inputTitle: {
    color: '#000',
    marginTop: 20,
    marginLeft: 10,
    fontWeight: '500',
  },
  modal: {
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
});
