import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'outlined' | 'solid';
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'outlined',
  containerStyle,
  disabled,
}) => {
  const buttonStyle = StyleSheet.flatten([
    styles.button,
    containerStyle,
    {
      opacity: disabled ? 0.5 : 1,
      backgroundColor: type === 'outlined' ? 'transparent' : 'black',
    },
  ]);
  const buttonTitleStyle = StyleSheet.flatten([
    styles.buttonTitle,
    {
      color: type === 'outlined' ? 'black' : 'white',
    },
  ]);
  return (
    <TouchableOpacity disabled={disabled} style={buttonStyle} onPress={onPress}>
      <Text style={buttonTitleStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    borderStyle: 'solid',
    borderWidth: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTitle: {
    color: 'black',
    margin: 5,
    fontSize: 15,
    fontWeight: '600',
  },
});
