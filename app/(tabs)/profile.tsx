import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme, useCurrentCharacter } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useHomeworkStore, HomeLayout } from '@/src/stores/homeworkStore';
import { useAppVersionStore } from '@/src/config/appVersion';
import { allCharacters, seniorThemes, juniorThemes, defaultTheme } from '@/src/theme/themes';
import { useMemo } from 'react';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import ProgressBar from '@/src/components/ui/ProgressBar';
import { AppTheme, ThemeCharacter } from '@/src/types';
import Avatar from '@/src/components/ui/Avatar';
import ThemeBackground from '@/src/components/theme/ThemeBackground';
import { getLevel } from '@/src/utils/levelHelpers';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const character = useCurrentCharacter();
  const student = useStudentStore((s) => s.student);
  const themeId = useThemeStore((s) => s.themeId);
  const characterId = useThemeStore((s) => s.characterId);
  const setThemeId = useThemeStore((s) => s.setTheme);
  const setCharacterId = useThemeStore((s) => s.setCharacter);
  const ageGroup = useThemeStore((s) => s.ageGroup);
  const homeLayout = useHomeworkStore((s) => s.homeLayout);
  const setHomeLayout = useHomeworkStore((s) => s.setHomeLayout);

  const availableThemes = useMemo(
    () => {
      const grouped = ageGroup === 'senior' ? seniorThemes : juniorThemes;
      // Нейрум — дефолт для всех, всегда первым в списке
      if (grouped.some((t) => t.id === defaultTheme.id)) return grouped;
      return [defaultTheme, ...grouped];
    },
    [ageGroup],
  );
  const appVersion = useAppVersionStore((s) => s.appVersion);
  const ageLabel = ageGroup === 'senior' ? '8–11 класс' : '5–7 класс';
  const { level, currentLevelXp, xpForNextLevel, rank } = getLevel(student.totalPoints);
  const age = useAgeStyles();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { padding: age.contentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: theme.colors.text, fontSize: age.headerSize }]}>
            {age.isJunior ? '👤 Профиль' : 'Профиль'}
          </Text>
        </View>

        {/* Student Info */}
        <Card style={[styles.infoCard, { borderRadius: age.cardBorderRadius }]}>
          <View style={styles.avatarContainer}>
            <Avatar size={age.isJunior ? 100 : 80} neutral />
          </View>
          <Text style={[styles.studentName, { color: theme.colors.text, fontSize: age.isJunior ? 26 : 22 }]}>
            {student.firstName} {student.lastName}
          </Text>
          <Text style={[styles.classInfo, { color: theme.colors.textSecondary, fontSize: age.bodySize }]}>
            {student.classId.replace(/(\d+)(\D)/, '$1-$2')} класс
          </Text>

          {appVersion >= 1 && (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                    🚀 {student.earlyStreak}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    ДЗ вовремя подряд
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                    {rank.emoji} {rank.title}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Уровень {level} · {student.totalPoints} очков
                  </Text>
                </View>
              </View>
              <View style={styles.levelProgressRow}>
                <ProgressBar
                  progress={(currentLevelXp / xpForNextLevel) * 100}
                  color={theme.colors.primary}
                  height={6}
                />
                <Text style={[styles.levelProgressLabel, { color: theme.colors.textSecondary }]}>
                  {currentLevelXp} / {xpForNextLevel} до уровня {level + 1}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Mascot (V1+) */}
        {appVersion >= 1 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: age.sectionTitleSize }]}>
              {age.isJunior ? '🐾 Мой персонаж' : 'Мой персонаж'}
            </Text>
            <Card style={{ borderRadius: age.cardBorderRadius }}>
              <Mascot health={student.mascotHealth} showHealthBar={false} size={age.mascotSize} compact />
            </Card>
          </>
        )}

        {/* Character Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: age.sectionTitleSize }]}>
          {age.isJunior ? '🎭 Выбор персонажа' : 'Выбор персонажа'}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themesRow}
        >
          {allCharacters.map((c: ThemeCharacter) => (
            <CharacterCard key={c.id} character={c} isSelected={c.id === characterId} onSelect={setCharacterId} theme={theme} />
          ))}
        </ScrollView>

        {/* Home Layout Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: age.sectionTitleSize }]}>
          {age.isJunior ? '🏠 Вид главной' : 'Вид главной'}
        </Text>
        <View style={styles.layoutRow}>
          {/* Mascot preview */}
          <TouchableOpacity
            style={[
              styles.layoutCard,
              {
                backgroundColor: homeLayout === 'mascot' ? theme.colors.primary + '12' : theme.colors.surface,
                borderColor: homeLayout === 'mascot' ? theme.colors.primary : theme.colors.border,
                borderWidth: homeLayout === 'mascot' ? 2.5 : 1,
              },
            ]}
            onPress={() => setHomeLayout('mascot')}
            activeOpacity={0.7}
          >
            {/* Mini screen: mascot layout */}
            <View style={styles.miniScreen}>
              {/* Header row: greeting left, mascot right */}
              <View style={styles.miniRow}>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={[styles.miniLine, { width: '70%', backgroundColor: theme.colors.text + '30' }]} />
                  <View style={[styles.miniLine, { width: '50%', backgroundColor: theme.colors.text + '18' }]} />
                </View>
                <View style={styles.miniMascotArea}>
                  <View style={[styles.miniMascotCircle, { backgroundColor: theme.colors.primary + '25' }]}>
                    <Text style={{ fontSize: 16 }}>🐾</Text>
                  </View>
                  <View style={[styles.miniHealthBar, { backgroundColor: theme.colors.border }]}>
                    <View style={[styles.miniHealthFill, { backgroundColor: theme.colors.primary, width: '65%' }]} />
                  </View>
                </View>
              </View>
              {/* Homework cards */}
              <View style={[styles.miniCard, { backgroundColor: theme.colors.border + '60' }]} />
              <View style={[styles.miniCard, { backgroundColor: theme.colors.border + '40' }]} />
            </View>
            <Text
              style={[
                styles.layoutCardLabel,
                { color: homeLayout === 'mascot' ? theme.colors.primary : theme.colors.text },
              ]}
            >
              С персонажем
            </Text>
          </TouchableOpacity>

          {/* Dashboard preview */}
          <TouchableOpacity
            style={[
              styles.layoutCard,
              {
                backgroundColor: homeLayout === 'dashboard' ? theme.colors.primary + '12' : theme.colors.surface,
                borderColor: homeLayout === 'dashboard' ? theme.colors.primary : theme.colors.border,
                borderWidth: homeLayout === 'dashboard' ? 2.5 : 1,
              },
            ]}
            onPress={() => setHomeLayout('dashboard')}
            activeOpacity={0.7}
          >
            {/* Mini screen: dashboard layout */}
            <View style={styles.miniScreen}>
              {/* Header */}
              <View style={[styles.miniLine, { width: '60%', backgroundColor: theme.colors.text + '30' }]} />
              {/* Dashboard card */}
              <View style={[styles.miniDashboard, { backgroundColor: theme.colors.border + '40', borderColor: theme.colors.border }]}>
                <View style={styles.miniDashRow}>
                  {/* Grade bars */}
                  <View style={{ flex: 1, gap: 3 }}>
                    {[75, 55, 90].map((w, i) => (
                      <View key={i} style={styles.miniBarRow}>
                        <View style={[styles.miniBarLabel, { backgroundColor: theme.colors.text + '18' }]} />
                        <View style={[styles.miniBarTrack, { backgroundColor: theme.colors.border }]}>
                          <View style={[styles.miniBarFill, { width: `${w}%`, backgroundColor: w >= 80 ? '#16A34A' : w >= 60 ? '#F59E0B' : '#EF4444' }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                  {/* Stats column */}
                  <View style={{ width: 28, gap: 3, alignItems: 'center' }}>
                    <View style={[styles.miniStatDot, { backgroundColor: '#3B82F6' }]} />
                    <View style={[styles.miniStatDot, { backgroundColor: '#F59E0B' }]} />
                    <View style={[styles.miniStatDot, { backgroundColor: '#16A34A' }]} />
                  </View>
                </View>
              </View>
              {/* Homework cards */}
              <View style={[styles.miniCard, { backgroundColor: theme.colors.border + '60' }]} />
              <View style={[styles.miniCard, { backgroundColor: theme.colors.border + '40' }]} />
            </View>
            <Text
              style={[
                styles.layoutCardLabel,
                { color: homeLayout === 'dashboard' ? theme.colors.primary : theme.colors.text },
              ]}
            >
              С оценками
            </Text>
          </TouchableOpacity>
        </View>

        {/* Theme Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: age.sectionTitleSize }]}>
          {age.isJunior ? '🎨 Выбор темы' : 'Выбор темы'}
        </Text>

        <Text style={[styles.ageGroupLabel, { color: theme.colors.textSecondary }]}>
          {ageLabel}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themesRow}
        >
          {availableThemes.map((t: AppTheme) => (
            <ThemeCard key={t.id} theme={t} isSelected={t.id === themeId} onSelect={setThemeId} />
          ))}
        </ScrollView>

        <View style={styles.bottomSpacer} />
      </ScrollView>

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

// Memoized character card
const CharacterCard = memo(function CharacterCard({
  character: c,
  isSelected,
  onSelect,
  theme: t,
}: {
  character: ThemeCharacter;
  isSelected: boolean;
  onSelect: (id: string) => void;
  theme: AppTheme;
}) {
  const handlePress = useCallback(() => onSelect(c.id), [onSelect, c.id]);

  return (
    <TouchableOpacity
      style={[
        styles.characterCard,
        {
          backgroundColor: t.colors.surface,
          borderColor: isSelected ? t.colors.primary : t.colors.border,
          borderWidth: isSelected ? 3 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.characterEmoji}>{c.emoji}</Text>
      <Text style={[styles.characterName, { color: t.colors.text }]} numberOfLines={1}>
        {c.name}
      </Text>
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
  levelProgressRow: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  levelProgressLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },

  // Home layout
  layoutRow: {
    flexDirection: 'row',
    gap: 12,
  },
  layoutCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },
  layoutCardLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniScreen: {
    width: '100%',
    aspectRatio: 1.6,
    gap: 5,
  },
  miniRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniLine: {
    height: 5,
    borderRadius: 2.5,
  },
  miniMascotArea: {
    alignItems: 'center',
    width: 40,
    gap: 3,
  },
  miniMascotCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniHealthBar: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  miniHealthFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  miniCard: {
    height: 14,
    borderRadius: 4,
  },
  miniDashboard: {
    borderRadius: 6,
    borderWidth: 0.5,
    padding: 5,
  },
  miniDashRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  miniBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniBarLabel: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  miniBarTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  miniStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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

  // Characters
  characterCard: {
    width: 100,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  characterEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  characterName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 100,
  },
});
