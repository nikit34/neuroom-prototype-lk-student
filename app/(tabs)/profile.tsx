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
import { useAppVersionStore } from '@/src/config/appVersion';
import { allCharacters, seniorThemes, juniorThemes } from '@/src/theme/themes';
import { useMemo } from 'react';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import ProgressBar from '@/src/components/ui/ProgressBar';
import { AppTheme, ThemeCharacter } from '@/src/types';
import ThemeBackground from '@/src/components/theme/ThemeBackground';
import { getLevel } from '@/src/utils/levelHelpers';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const character = useCurrentCharacter();
  const student = useStudentStore((s) => s.student);
  const themeId = useThemeStore((s) => s.themeId);
  const characterId = useThemeStore((s) => s.characterId);
  const setThemeId = useThemeStore((s) => s.setTheme);
  const setCharacterId = useThemeStore((s) => s.setCharacter);
  const ageGroup = useThemeStore((s) => s.ageGroup);

  const availableThemes = useMemo(
    () => (ageGroup === 'senior' ? seniorThemes : juniorThemes),
    [ageGroup],
  );
  const appVersion = useAppVersionStore((s) => s.appVersion);
  const ageLabel = ageGroup === 'senior' ? '8–11 класс' : '5–7 класс';
  const { level, currentLevelXp, xpForNextLevel, rank } = getLevel(student.totalPoints);

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
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Мой маскот
            </Text>
            <Card>
              <Mascot health={student.mascotHealth} showHealthBar={false} size={70} compact />
            </Card>
          </>
        )}

        {/* Character Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Выбор персонажа
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

        {/* Theme Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Выбор темы
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
