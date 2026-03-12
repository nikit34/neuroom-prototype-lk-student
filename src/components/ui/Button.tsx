import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';
import { AppTheme } from '@/src/types';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
}: ButtonProps) {
  const theme = useAppTheme();
  const age = useAgeStyles();
  const styles = makeStyles(theme, variant, disabled, age.isJunior);

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? theme.colors.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.container}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
}

function makeStyles(theme: AppTheme, variant: ButtonVariant, disabled: boolean, isJunior: boolean) {
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isJunior ? 17 : 14,
    paddingHorizontal: isJunior ? 28 : 24,
    borderRadius: isJunior ? 16 : 12,
    opacity: disabled ? 0.5 : 1,
  };

  const variantContainer: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    danger: {
      backgroundColor: theme.colors.overdue,
    },
  };

  const variantText: Record<ButtonVariant, TextStyle> = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#FFFFFF' },
    outline: { color: theme.colors.primary },
    danger: { color: '#FFFFFF' },
  };

  return StyleSheet.create({
    container: {
      ...baseContainer,
      ...variantContainer[variant],
    },
    text: {
      fontSize: isJunior ? 18 : 16,
      fontWeight: '600',
      ...variantText[variant],
    },
    icon: {
      fontSize: isJunior ? 22 : 18,
      marginRight: 8,
    },
  });
}
