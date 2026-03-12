import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';

interface BadgeProps {
  text: string;
  color: string;
  variant?: 'filled' | 'outline';
}

export default function Badge({ text, color, variant = 'filled' }: BadgeProps) {
  const isFilled = variant === 'filled';
  const age = useAgeStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isFilled ? color : 'transparent',
          borderColor: color,
          borderWidth: isFilled ? 0 : 1.5,
          paddingHorizontal: age.isJunior ? 13 : 10,
          paddingVertical: age.isJunior ? 6 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isFilled ? '#FFFFFF' : color, fontSize: age.isJunior ? 14 : 12 },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
