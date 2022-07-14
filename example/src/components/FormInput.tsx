import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardType } from 'react-native';

export interface FormInputProps {
  title: string;
  value: string;
  editable?: boolean;
  onPress?: () => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardType;
}

const FormInput: React.FC<FormInputProps> = ({
  title,
  value,
  editable = true,
  onChange,
  placeholder,
  onPress,
  keyboardType,
}) => {
  const [opacity, setOpacity] = useState(1);
  const containerStyle = StyleSheet.flatten([styles.container, { opacity }]);
  return (
    <View style={containerStyle}>
      <Text style={styles.inputTitle}>{title}</Text>
      <TextInput
        keyboardType={keyboardType}
        style={styles.input}
        value={value}
        editable={editable}
        placeholder={placeholder}
        onChangeText={(text) => onChange?.(text)}
        onPressIn={() => setOpacity(0.3)}
        onPressOut={() => {
          setOpacity(1);
          onPress?.();
        }}
      />
    </View>
  );
};

export default FormInput;

const styles = StyleSheet.create({
  container: {
    maxWidth: 500,
    alignSelf: 'stretch',
  },
  input: {
    height: 40,
    padding: 10,
    borderWidth: 1,
    marginTop: 10,
    borderRadius: 3,
  },
  inputTitle: {
    color: 'black',
    marginTop: 20,
    marginLeft: 10,
    fontWeight: '500',
  },
});
