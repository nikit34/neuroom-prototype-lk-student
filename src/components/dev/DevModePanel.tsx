import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useArenaStore } from '@/src/stores/arenaStore';
import { useChatStore, AI_TUTOR_ID } from '@/src/stores/chatStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { useAppealStore } from '@/src/stores/appealStore';
import { getMascotState, getMascotStateLabel } from '@/src/utils/gradeHelpers';
import { useAppVersionStore, AppVersion } from '@/src/config/appVersion';
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

function AppVersionSwitch() {
  const theme = useAppTheme();
  const appVersion = useAppVersionStore((s) => s.appVersion);
  const setAppVersion = useAppVersionStore((s) => s.setAppVersion);

  const options: { key: AppVersion; label: string; desc: string }[] = [
    { key: 0, label: 'V0', desc: 'MVP' },
    { key: 1, label: 'V1', desc: 'Базовый' },
    { key: 2, label: 'V2', desc: 'Полный' },
  ];

  return (
    <View style={styles.ageGroupSection}>
      <View style={styles.ageGroupRow}>
        {options.map((opt) => {
          const isActive = appVersion === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.versionBtn,
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
              onPress={() => setAppVersion(opt.key)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? theme.colors.primary : theme.colors.text,
                }}
              >
                {opt.label}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.colors.textSecondary,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {opt.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
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

function ArenaFeatureToggles() {
  const theme = useAppTheme();
  const achievementsEnabled = useArenaStore((s) => s.achievementsEnabled);
  const questsEnabled = useArenaStore((s) => s.questsEnabled);
  const challengesEnabled = useArenaStore((s) => s.challengesEnabled);
  const setAchievementsEnabled = useArenaStore((s) => s.setAchievementsEnabled);
  const setQuestsEnabled = useArenaStore((s) => s.setQuestsEnabled);
  const setChallengesEnabled = useArenaStore((s) => s.setChallengesEnabled);

  const toggles = [
    { label: 'Достижения', enabled: achievementsEnabled, onToggle: () => setAchievementsEnabled(!achievementsEnabled) },
    { label: 'Квесты', enabled: questsEnabled, onToggle: () => setQuestsEnabled(!questsEnabled) },
    { label: 'Испытания', enabled: challengesEnabled, onToggle: () => setChallengesEnabled(!challengesEnabled) },
  ];

  return (
    <View style={styles.toggleSection}>
      {toggles.map((t) => (
        <TouchableOpacity
          key={t.label}
          style={[
            styles.toggleRow,
            {
              backgroundColor: t.enabled ? theme.colors.primary + '20' : theme.colors.background,
              borderColor: t.enabled ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={t.onToggle}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{t.label}</Text>
          <View
            style={[
              styles.toggleIndicator,
              { backgroundColor: t.enabled ? theme.colors.primary : theme.colors.border },
            ]}
          >
            <Text style={styles.toggleIndicatorText}>{t.enabled ? 'ON' : 'OFF'}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ChatFeatureToggle() {
  const theme = useAppTheme();
  const teacherChatEnabled = useChatStore((s) => s.teacherChatEnabled);
  const setTeacherChatEnabled = useChatStore((s) => s.setTeacherChatEnabled);

  return (
    <View style={styles.toggleSection}>
      <TouchableOpacity
        style={[
          styles.toggleRow,
          {
            backgroundColor: teacherChatEnabled ? theme.colors.primary + '20' : theme.colors.background,
            borderColor: teacherChatEnabled ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setTeacherChatEnabled(!teacherChatEnabled)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Чат с учителями</Text>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
            {teacherChatEnabled ? 'Список учителей + AI' : 'Только AI-Репетитор'}
          </Text>
        </View>
        <View
          style={[
            styles.toggleIndicator,
            { backgroundColor: teacherChatEnabled ? theme.colors.primary : theme.colors.border },
          ]}
        >
          <Text style={styles.toggleIndicatorText}>{teacherChatEnabled ? 'ON' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function AiTutorLimitReset() {
  const theme = useAppTheme();
  const questionsUsed = useChatStore((s) => s.aiTutorQuestionsUsed);
  const unlocked = useChatStore((s) => s.aiTutorUnlocked);
  const resetLimit = useChatStore((s) => s.resetAiTutorLimit);
  const [done, setDone] = useState(false);

  const handlePress = useCallback(() => {
    resetLimit();
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }, [resetLimit]);

  return (
    <View style={styles.toggleSection}>
      <TouchableOpacity
        style={[styles.toggleRow, {
          backgroundColor: done ? '#10B98120' : theme.colors.background,
          borderColor: done ? '#10B981' : theme.colors.border,
        }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: done ? '#10B981' : theme.colors.text }]}>
            {done ? '✅ Лимит сброшен' : '🔄 Сбросить лимит AI-репетитора'}
          </Text>
          <Text style={{ fontSize: 11, color: done ? '#10B981' : theme.colors.textSecondary, marginTop: 2 }}>
            {unlocked ? 'Полный доступ активен' : `Использовано: ${questionsUsed}/25`}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function ProgressSummaryToggle() {
  const theme = useAppTheme();
  const devShowProgressSummary = useHomeworkStore((s) => s.devShowProgressSummary);
  const setDevShowProgressSummary = useHomeworkStore((s) => s.setDevShowProgressSummary);

  return (
    <View style={styles.toggleSection}>
      <TouchableOpacity
        style={[
          styles.toggleRow,
          {
            backgroundColor: devShowProgressSummary ? theme.colors.primary + '20' : theme.colors.background,
            borderColor: devShowProgressSummary ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setDevShowProgressSummary(!devShowProgressSummary)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Саммари прогресса</Text>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
            {devShowProgressSummary ? 'Рекомендация под прогресс-баром' : 'Скрыта'}
          </Text>
        </View>
        <View
          style={[
            styles.toggleIndicator,
            { backgroundColor: devShowProgressSummary ? theme.colors.primary : theme.colors.border },
          ]}
        >
          <Text style={styles.toggleIndicatorText}>{devShowProgressSummary ? 'ON' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function HideHomeworkToggle() {
  const theme = useAppTheme();
  const devHideHomework = useHomeworkStore((s) => s.devHideHomework);
  const setDevHideHomework = useHomeworkStore((s) => s.setDevHideHomework);

  return (
    <View style={styles.toggleSection}>
      <TouchableOpacity
        style={[
          styles.toggleRow,
          {
            backgroundColor: devHideHomework ? theme.colors.primary + '20' : theme.colors.background,
            borderColor: devHideHomework ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setDevHideHomework(!devHideHomework)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Скрыть ДЗ на главной</Text>
          <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 }}>
            {devHideHomework ? 'Показывается пустое состояние' : 'Показываются активные задания'}
          </Text>
        </View>
        <View
          style={[
            styles.toggleIndicator,
            { backgroundColor: devHideHomework ? theme.colors.primary : theme.colors.border },
          ]}
        >
          <Text style={styles.toggleIndicatorText}>{devHideHomework ? 'ON' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function ResetHomeworkButton() {
  const theme = useAppTheme();
  const resetAssignments = useHomeworkStore((s) => s.resetAssignments);
  const [done, setDone] = useState(false);

  const handlePress = useCallback(() => {
    resetAssignments();
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }, [resetAssignments]);

  return (
    <View style={styles.toggleSection}>
      <TouchableOpacity
        style={[styles.toggleRow, {
          backgroundColor: done ? '#10B98120' : theme.colors.background,
          borderColor: done ? '#10B981' : theme.colors.border,
        }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: done ? '#10B981' : theme.colors.text }]}>
            {done ? '✅ Домашки сброшены' : '📚 Сбросить домашки'}
          </Text>
          <Text style={{ fontSize: 11, color: done ? '#10B981' : theme.colors.textSecondary, marginTop: 2 }}>
            Вернуть все задания в начальное состояние
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function RestartOnboardingButton({ onClose }: { onClose?: () => void }) {
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const resetChatOnboarding = useChatStore((s) => s.resetChatOnboarding);
  const resetAssignments = useHomeworkStore((s) => s.resetAssignments);
  const resetAppeals = useAppealStore((s) => s.resetAppeals);

  return (
    <TouchableOpacity
      style={[styles.specialBtn, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
      onPress={() => {
        onClose?.();
        resetOnboarding();
        resetChatOnboarding();
        resetAssignments();
        resetAppeals();
      }}
      activeOpacity={0.7}
    >
      <Text style={[styles.specialBtnText, { color: '#EF4444' }]}>
        🔄 Перезапустить онбординг
      </Text>
    </TouchableOpacity>
  );
}

function ScreenGroup({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={styles.screenGroup}>
      <View style={[styles.screenGroupHeader, { borderBottomColor: theme.colors.border }]}>
        <Text style={styles.screenGroupEmoji}>{emoji}</Text>
        <Text style={[styles.screenGroupTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <View style={styles.screenGroupContent}>{children}</View>
    </View>
  );
}

export default function DevModePanel({ onAwardBadge, onAwardRandomBadge, onAwardBadgeSeries, onClose }: DevModePanelProps) {
  const theme = useAppTheme();
  const appVersion = useAppVersionStore((s) => s.appVersion);
  const achievementsEnabled = useArenaStore((s) => s.achievementsEnabled);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* ── Общее ── */}
      <ScreenGroup title="Общее" emoji="⚙️">
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
          ВЕРСИЯ ПРИЛОЖЕНИЯ
        </Text>
        <AppVersionSwitch />

        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          РЕЖИМ ЛК
        </Text>
        <AgeGroupSwitch />

        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          ОНБОРДИНГ
        </Text>
        <RestartOnboardingButton onClose={onClose} />
      </ScreenGroup>

      {/* ── Главная (V1+) ── */}
      {appVersion >= 1 && (
        <ScreenGroup title="Главная" emoji="🏠">
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            ЗДОРОВЬЕ МАСКОТА
          </Text>
          <HealthSlider />

          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            ПРОГРЕСС
          </Text>
          <ProgressSummaryToggle />

          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            ДОМАШНИЕ ЗАДАНИЯ
          </Text>
          <HideHomeworkToggle />
          <View style={{ height: 8 }} />
          <ResetHomeworkButton />

        </ScreenGroup>
      )}

      {/* ── Чат (V1+) ── */}
      {appVersion >= 1 && (
        <ScreenGroup title="Чат" emoji="💬">
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            РЕЖИМ ЧАТА
          </Text>
          <ChatFeatureToggle />

          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            AI-РЕПЕТИТОР
          </Text>
          <AiTutorLimitReset />

        </ScreenGroup>
      )}

      {/* ── Арена (V2 only) ── */}
      {appVersion >= 2 && <ScreenGroup title="Арена" emoji="⚔️">
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
          МЕХАНИКИ
        </Text>
        <ArenaFeatureToggles />

        {achievementsEnabled && (<>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
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
        </>)}
      </ScreenGroup>}
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

  screenGroup: {
    marginBottom: 16,
  },
  screenGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    marginBottom: 14,
    borderBottomWidth: 1,
  },
  screenGroupEmoji: {
    fontSize: 18,
  },
  screenGroupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  screenGroupContent: {},

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Version Switch
  versionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
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

  // Feature toggles
  toggleSection: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleIndicatorText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
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
