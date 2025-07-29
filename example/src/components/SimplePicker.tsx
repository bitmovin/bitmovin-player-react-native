import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';

export interface SimplePickerOption<T = any> {
  label: string;
  value: T;
}

export interface SimplePickerProps<T = any> {
  options: SimplePickerOption<T>[];
  selectedValue?: T;
  onValueChange?: (value: T, index: number) => void;
  placeholder?: string;
  style?: any;
}

export default function SimplePicker<T = any>({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  style,
}: SimplePickerProps<T>) {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption?.label || placeholder;

  const handleSelect = (option: SimplePickerOption<T>, index: number) => {
    setIsVisible(false);
    onValueChange?.(option.value, index);
  };

  const renderOption = ({ item, index }: { item: SimplePickerOption<T>; index: number }) => {
    const isSelected = item.value === selectedValue;
    
    return (
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && styles.selectedOption,
          Platform.isTV && styles.tvOption,
        ]}
        onPress={() => handleSelect(item, index)}
      >
        <Text
          style={[
            styles.optionText,
            isSelected && styles.selectedOptionText,
            Platform.isTV && styles.tvOptionText,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.picker, style]}
        onPress={() => setIsVisible(true)}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedOption && styles.placeholderText,
            Platform.isTV && styles.tvPickerText,
          ]}
        >
          {displayText}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType={Platform.isTV ? 'fade' : 'slide'}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, Platform.isTV && styles.tvModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, Platform.isTV && styles.tvModalTitle]}>
                Select an option
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${String(item.value)}-${index}`}
              renderItem={renderOption}
              style={styles.optionsList}
              showsVerticalScrollIndicator={!Platform.isTV}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  tvPickerText: {
    fontSize: 18,
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  tvModalContent: {
    maxWidth: 600,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  tvModalTitle: {
    fontSize: 22,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  optionsList: {
    flexGrow: 0,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  tvOption: {
    paddingVertical: 20,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  tvOptionText: {
    fontSize: 18,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#1976d2',
  },
});