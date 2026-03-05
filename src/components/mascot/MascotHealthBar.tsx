import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/hooks/useAppTheme';

export interface MascotHealthBarProps {
  health: number; // 0-100
  streakBonus?: number;
}

function getHealthColor(health: number): string {
  if (health < 20) return '#EF4444';
  if (health < 40) return '#F97316';
  if (health < 60) return '#EAB308';
  if (health < 80) return '#22C55E';
  return '#16A34A';
}

function getHealthGradient(health: number): [string, string] {
  if (health < 20) return ['#DC2626', '#EF4444'];
  if (health < 40) return ['#EA580C', '#F97316'];
  if (health < 60) return ['#CA8A04', '#EAB308'];
  if (health < 80) return ['#16A34A', '#22C55E'];
  return ['#15803D', '#4ADE80'];
}

export default function MascotHealthBar({ health, streakBonus }: MascotHealthBarProps) {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(100, health));
  const animatedWidth = useSharedValue(0);
  const color = getHealthColor(clamped);
  const gradient = getHealthGradient(clamped);

  useEffect(() => {
    animatedWidth.value = withTiming(clamped, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Здоровье
        </Text>
        <Text style={[styles.value, { color }]}>
          {Math.round(clamped)}{streakBonus ? ` (+${streakBonus})` : ''}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
        <Animated.View style={[styles.fillWrapper, animatedStyle]}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fillWrapper: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
});
