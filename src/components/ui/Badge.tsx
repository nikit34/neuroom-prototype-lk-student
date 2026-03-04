import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  text: string;
  color: string;
  variant?: 'filled' | 'outline';
}

export default function Badge({ text, color, variant = 'filled' }: BadgeProps) {
  const isFilled = variant === 'filled';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isFilled ? color : 'transparent',
          borderColor: color,
          borderWidth: isFilled ? 0 : 1.5,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isFilled ? '#FFFFFF' : color },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
