import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

interface AvatarProps {
  emoji?: string;
  name?: string;
  size?: number;
  backgroundColor?: string;
}

export default function Avatar({
  emoji,
  name,
  size = 48,
  backgroundColor,
}: AvatarProps) {
  const theme = useAppTheme();
  const bgColor = backgroundColor || theme.colors.surface;

  const initials = name
    ? name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      {emoji ? (
        <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.35,
              color: theme.colors.text,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
  },
});
