import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = [styles.button, styles[`button_${size}`]];

    if (variant === 'primary') {
      baseStyle.push(styles.buttonPrimary);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.buttonSecondary);
    } else if (variant === 'outline') {
      baseStyle.push(styles.buttonOutline);
    } else if (variant === 'danger') {
      baseStyle.push(styles.buttonDanger);
    }

    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }

    return StyleSheet.flatten([...baseStyle, style]);
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = [styles.text, styles[`text_${size}`]];

    if (variant === 'outline') {
      baseStyle.push(styles.textOutline);
    }

    if (disabled) {
      baseStyle.push(styles.textDisabled);
    }

    return StyleSheet.flatten([...baseStyle, textStyle]);
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#5B5FFF' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button_medium: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  button_large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonPrimary: {
    backgroundColor: '#5B5FFF',
  },
  buttonSecondary: {
    backgroundColor: '#6C757D',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#5B5FFF',
  },
  buttonDanger: {
    backgroundColor: '#DC3545',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  text: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  textOutline: {
    color: '#5B5FFF',
  },
  textDisabled: {
    color: '#9E9E9E',
  },
});
