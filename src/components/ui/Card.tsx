import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Card({ children, style, onPress }: CardProps) {
  const theme = useAppTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
