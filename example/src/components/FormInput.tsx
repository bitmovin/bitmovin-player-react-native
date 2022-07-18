import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export interface FormInputProps {
  title: string;
  value: string;
  editable?: boolean;
  onPress?: () => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  textContentType?: TextInput['props']['textContentType'];
}

const FormInput: React.FC<FormInputProps> = ({
  title,
  value,
  editable = true,
  onChange,
  placeholder,
  onPress,
  secureTextEntry = false,
  textContentType,
}) => {
  const [opacity, setOpacity] = useState(1);
  const containerStyle = StyleSheet.flatten([styles.container, { opacity }]);
  return (
    <View style={containerStyle}>
      <Text style={styles.inputTitle}>{title}</Text>
      <TextInput
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
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
    color: 'black',
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
