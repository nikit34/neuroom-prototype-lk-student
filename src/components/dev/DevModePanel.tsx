import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { getMascotState, getMascotStateLabel } from '@/src/utils/gradeHelpers';
import { AchievementRarity } from '@/src/types';

const HEALTH_PRESETS = [0, 10, 25, 50, 75, 100];

const BADGE_SAMPLES: { rarity: AchievementRarity; label: string; color: string }[] = [
  { rarity: 'common', label: 'Обычный', color: '#10B981' },
  { rarity: 'rare', label: 'Редкий', color: '#3B82F6' },
  { rarity: 'epic', label: 'Эпический', color: '#8B5CF6' },
  { rarity: 'legendary', label: 'Легендарный', color: '#F59E0B' },
];

interface DevModePanelProps {
  onAwardBadge: (rarity: AchievementRarity) => void;
  onAwardRandomBadge: () => void;
  onAwardBadgeSeries: () => void;
  onClose?: () => void;
}

function HealthSlider() {
  const theme = useAppTheme();
  const health = useStudentStore((s) => s.student.mascotHealth);
  const setHealth = useStudentStore((s) => s.setMascotHealth);
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbX = useSharedValue(0);

  const state = getMascotState(health);
  const stateLabel = getMascotStateLabel(state);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    thumbX.value = (health / 100) * w;
  }, [health]);

  const updateHealth = useCallback((val: number) => {
    setHealth(Math.round(val));
  }, [setHealth]);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      const clamped = Math.max(0, Math.min(trackWidth, e.x));
      thumbX.value = clamped;
      const newHealth = (clamped / trackWidth) * 100;
      runOnJS(updateHealth)(newHealth);
    })
    .hitSlop({ top: 20, bottom: 20, left: 10, right: 10 });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - 14 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const getHealthColor = (h: number) => {
    if (h < 20) return '#EF4444';
    if (h < 40) return '#F97316';
    if (h < 60) return '#EAB308';
    if (h < 80) return '#22C55E';
    return '#16A34A';
  };

  return (
    <View style={styles.sliderSection}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>
          Здоровье: {Math.round(health)}
        </Text>
        <Text style={[styles.stateLabel, { color: getHealthColor(health) }]}>
          {stateLabel}
        </Text>
      </View>

      <GestureDetector gesture={gesture}>
        <View style={[styles.sliderTrack, { backgroundColor: theme.colors.border }]} onLayout={onLayout}>
          <Animated.View
            style={[styles.sliderFill, fillStyle, { backgroundColor: getHealthColor(health) }]}
          />
          <Animated.View
            style={[styles.sliderThumb, thumbStyle, { backgroundColor: getHealthColor(health), borderColor: theme.colors.surface }]}
          />
        </View>
      </GestureDetector>

      <View style={styles.presetsRow}>
        {HEALTH_PRESETS.map((val) => (
          <TouchableOpacity
            key={val}
            style={[
              styles.presetBtn,
              {
                backgroundColor: health === val
                  ? getHealthColor(val)
                  : theme.colors.surface,
                borderColor: getHealthColor(val),
              },
            ]}
            onPress={() => {
              setHealth(val);
              if (trackWidth > 0) {
                thumbX.value = withSpring((val / 100) * trackWidth, { damping: 15 });
              }
            }}
          >
            <Text
              style={[
                styles.presetText,
                { color: health === val ? '#FFF' : theme.colors.text },
              ]}
            >
              {val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AgeGroupSwitch() {
  const theme = useAppTheme();
  const ageGroup = useThemeStore((s) => s.ageGroup);
  const setAgeGroup = useThemeStore((s) => s.setAgeGroup);

  const options = [
    { key: 'senior' as const, label: 'Старшие (8-11)', emoji: '🎓' },
    { key: 'junior' as const, label: 'Младшие (5-7)', emoji: '🎒' },
  ];

  return (
    <View style={styles.ageGroupSection}>
      <View style={styles.ageGroupRow}>
        {options.map((opt) => {
          const isActive = ageGroup === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.ageGroupBtn,
                {
                  backgroundColor: isActive
                    ? theme.colors.primary + '20'
                    : theme.colors.background,
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderWidth: isActive ? 2 : 1,
                },
              ]}
              onPress={() => setAgeGroup(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.ageGroupEmoji}>{opt.emoji}</Text>
              <Text
                style={[
                  styles.ageGroupBtnText,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.text,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function RestartOnboardingButton({ onClose }: { onClose?: () => void }) {
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.specialBtn, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
      onPress={() => {
        onClose?.();
        resetOnboarding();
        router.replace('/onboarding');
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.specialBtnText, { color: '#EF4444' }]}>
        🔄 Перезапустить онбординг
      </Text>
    </TouchableOpacity>
  );
}

export default function DevModePanel({ onAwardBadge, onAwardRandomBadge, onAwardBadgeSeries, onClose }: DevModePanelProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* LK Mode Switch */}
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
        РЕЖИМ ЛК
      </Text>
      <AgeGroupSwitch />

      {/* Health Slider */}
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 20 }]}>
        ЗДОРОВЬЕ МАСКОТА
      </Text>
      <HealthSlider />

      {/* Badge Awards */}
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 20 }]}>
        ВЫДАТЬ БЕЙДЖ
      </Text>

      <View style={styles.badgeGrid}>
        {BADGE_SAMPLES.map((b) => (
          <TouchableOpacity
            key={b.rarity}
            style={[styles.badgeBtn, { backgroundColor: b.color + '20', borderColor: b.color }]}
            onPress={() => onAwardBadge(b.rarity)}
            activeOpacity={0.7}
          >
            <Text style={[styles.badgeBtnText, { color: b.color }]}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Special actions */}
      <View style={styles.specialRow}>
        <TouchableOpacity
          style={[styles.specialBtn, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}
          onPress={onAwardRandomBadge}
          activeOpacity={0.7}
        >
          <Text style={[styles.specialBtnText, { color: theme.colors.primary }]}>
            🎲 Случайный
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.specialBtn, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}
          onPress={onAwardBadgeSeries}
          activeOpacity={0.7}
        >
          <Text style={[styles.specialBtnText, { color: '#F59E0B' }]}>
            🔥 Серия x3
          </Text>
        </TouchableOpacity>
      </View>

      {/* Onboarding */}
      <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 20 }]}>
        НАВИГАЦИЯ
      </Text>
      <RestartOnboardingButton onClose={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  devTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  devDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Age Group Switch
  ageGroupSection: {},
  ageGroupRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ageGroupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  ageGroupEmoji: {
    fontSize: 18,
  },
  ageGroupBtnText: {
    fontSize: 14,
  },

  // Slider
  sliderSection: {},
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    justifyContent: 'center',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    position: 'absolute',
    top: -10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 6,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Badges
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  specialRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  specialBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  specialBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
