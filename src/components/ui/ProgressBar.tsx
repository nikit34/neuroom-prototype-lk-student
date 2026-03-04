import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({
  progress,
  color,
  height = 8,
  showLabel = false,
}: ProgressBarProps) {
  const theme = useAppTheme();
  const barColor = color || theme.colors.primary;
  const clamped = Math.max(0, Math.min(100, progress));
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(clamped, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: theme.colors.border,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              borderRadius: height / 2,
              height,
            },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {Math.round(clamped)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 36,
    textAlign: 'right',
  },
});
