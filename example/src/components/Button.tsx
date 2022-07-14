import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
}

const Button: React.FC<ButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    borderStyle: 'solid',
    borderWidth: 2,
    borderRadius: 5,
  },
  buttonTitle: {
    margin: 5,
    fontSize: 14,
    fontWeight: '600',
  },
});
