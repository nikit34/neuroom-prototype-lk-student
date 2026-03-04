import React, { useCallback, memo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, useCurrentCharacter } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { seniorThemes, juniorThemes } from '@/src/theme/themes';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import { AppTheme, AchievementRarity } from '@/src/types';
import ThemeBackground from '@/src/components/theme/ThemeBackground';
import DevModePanel from '@/src/components/dev/DevModePanel';
import BadgeCelebration from '@/src/components/dev/BadgeCelebration';
import { mockAchievements } from '@/src/data/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SAMPLE_BADGES: Record<AchievementRarity, { icon: string; title: string; description: string; rarity: AchievementRarity }> = {
  common: { icon: '🎯', title: 'Первый шаг', description: 'Сдайте первое домашнее задание', rarity: 'common' },
  rare: { icon: '⭐', title: 'Капитан команды', description: 'Станьте лидером в командном квесте', rarity: 'rare' },
  epic: { icon: '🔬', title: 'Учёный', description: 'Сдайте все лабораторные за четверть', rarity: 'epic' },
  legendary: { icon: '👑', title: 'Легенда школы', description: 'Серия 100 дней подряд', rarity: 'legendary' },
};

export default function ProfileScreen() {
  const theme = useAppTheme();
  const character = useCurrentCharacter();
  const student = useStudentStore((s) => s.student);
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setTheme);

  const [devMode, setDevMode] = useState(false);
  const [celebrationBadge, setCelebrationBadge] = useState<{
    icon: string; title: string; description: string; rarity: AchievementRarity;
  } | null>(null);
  const badgeQueueRef = useRef<typeof SAMPLE_BADGES[AchievementRarity][]>([]);

  const handleDevToggle = useCallback(() => {
    setDevMode((prev) => !prev);
  }, []);

  const handleAwardBadge = useCallback((rarity: AchievementRarity) => {
    setCelebrationBadge(SAMPLE_BADGES[rarity]);
  }, []);

  const handleAwardRandomBadge = useCallback(() => {
    const achWithEmoji = mockAchievements.filter((a) => a.icon);
    const randomAch = achWithEmoji[Math.floor(Math.random() * achWithEmoji.length)];
    setCelebrationBadge({
      icon: randomAch.icon,
      title: randomAch.title,
      description: randomAch.description,
      rarity: randomAch.rarity,
    });
  }, []);

  const handleAwardBadgeSeries = useCallback(() => {
    const series = [
      SAMPLE_BADGES.common,
      SAMPLE_BADGES.rare,
      SAMPLE_BADGES.epic,
    ];
    badgeQueueRef.current = series.slice(1);
    setCelebrationBadge(series[0]);
  }, []);

  const handleDismissCelebration = useCallback(() => {
    setCelebrationBadge(null);
    // Show next in queue after short delay
    setTimeout(() => {
      if (badgeQueueRef.current.length > 0) {
        const next = badgeQueueRef.current.shift()!;
        setCelebrationBadge(next);
      }
    }, 300);
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: theme.colors.text }]}>Профиль</Text>
          <TouchableOpacity
            onPress={handleDevToggle}
            style={[
              styles.devToggle,
              {
                backgroundColor: devMode ? theme.colors.accent + '20' : theme.colors.surface,
                borderColor: devMode ? theme.colors.accent : theme.colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.devToggleText, { color: devMode ? theme.colors.accent : theme.colors.textSecondary }]}>
              {devMode ? '🔧 DEV' : '🔧'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Student Info */}
        <Card style={styles.infoCard}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: theme.colors.primary + '30' },
              ]}
            >
              <Text style={styles.avatarEmoji}>{character.emoji}</Text>
            </View>
          </View>
          <Text style={[styles.studentName, { color: theme.colors.text }]}>
            {student.firstName} {student.lastName}
          </Text>
          <Text style={[styles.classInfo, { color: theme.colors.textSecondary }]}>
            {student.grade} класс, {student.classId}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                🔥 {student.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Серия (дней)
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                ⭐ {student.totalPoints}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Очки XP
              </Text>
            </View>
          </View>
        </Card>

        {/* Mascot */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Мой маскот
        </Text>
        <Card>
          <Mascot health={student.mascotHealth} />
        </Card>

        {/* Dev Mode Panel */}
        {devMode && (
          <View style={styles.devSection}>
            <DevModePanel
              onAwardBadge={handleAwardBadge}
              onAwardRandomBadge={handleAwardRandomBadge}
              onAwardBadgeSeries={handleAwardBadgeSeries}
            />
          </View>
        )}

        {/* Theme Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Выбор темы
        </Text>

        <Text style={[styles.ageGroupLabel, { color: theme.colors.textSecondary }]}>
          8–11 класс
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themesRow}
        >
          {seniorThemes.map((t: AppTheme) => (
            <ThemeCard key={t.id} theme={t} isSelected={t.id === themeId} onSelect={setThemeId} />
          ))}
        </ScrollView>

        <Text style={[styles.ageGroupLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
          5–7 класс
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themesRow}
        >
          {juniorThemes.map((t: AppTheme) => (
            <ThemeCard key={t.id} theme={t} isSelected={t.id === themeId} onSelect={setThemeId} />
          ))}
        </ScrollView>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Badge Celebration Overlay */}
      {celebrationBadge && (
        <BadgeCelebration
          badge={celebrationBadge}
          onDismiss={handleDismissCelebration}
        />
      )}
    </SafeAreaView>
  );
}

// Memoized theme card
const ThemeCard = memo(function ThemeCard({
  theme: t,
  isSelected,
  onSelect,
}: {
  theme: AppTheme;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const handlePress = useCallback(() => onSelect(t.id), [onSelect, t.id]);

  return (
    <TouchableOpacity
      style={[
        styles.themeCard,
        {
          backgroundColor: t.colors.surface,
          borderColor: isSelected ? t.colors.primary : t.colors.border,
          borderWidth: isSelected ? 3 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.themeEmoji}>{t.emoji}</Text>
      <Text style={[styles.themeName, { color: t.colors.text }]}>{t.name}</Text>
      <View style={styles.colorPreview}>
        <View style={[styles.colorDot, { backgroundColor: t.colors.primary }]} />
        <View style={[styles.colorDot, { backgroundColor: t.colors.secondary }]} />
        <View style={[styles.colorDot, { backgroundColor: t.colors.accent }]} />
      </View>
      {isSelected && <Text style={styles.selectedCheck}>✓</Text>}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
  },
  devToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  devToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  devSection: {
    marginTop: 16,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  classInfo: {
    fontSize: 15,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },

  // Themes
  ageGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themesRow: {
    gap: 12,
    paddingRight: 20,
  },
  themeCard: {
    width: 120,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  themeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 100,
  },
});
