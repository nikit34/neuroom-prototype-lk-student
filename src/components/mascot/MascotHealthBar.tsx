import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
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

export default function MascotHealthBar({ health }: MascotHealthBarProps) {
  const theme = useAppTheme();
  const [showHint, setShowHint] = useState(false);
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
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowHint(true)}
        activeOpacity={0.7}
      >
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Здоровье
          </Text>
          <Text style={[styles.value, { color }]}>
            {Math.round(clamped)}%
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
      </TouchableOpacity>

      <Modal
        visible={showHint}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHint(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowHint(false)}>
          <View style={[styles.hintCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.hintTitle, { color: theme.colors.text }]}>
              Здоровье маскота
            </Text>
            <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
              Сдавай домашку вовремя — и твой персонаж будет здоров и счастлив! Чем быстрее сдаёшь, тем больше здоровья получает маскот.
            </Text>
            <TouchableOpacity
              style={[styles.hintClose, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowHint(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.hintCloseText}>Понятно</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
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
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: 3,
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
  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  hintCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  hintClose: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  hintCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
