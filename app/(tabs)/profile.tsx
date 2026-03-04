import React, { useState, useMemo, useCallback, memo } from 'react';
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
import { themes, seniorThemes, juniorThemes } from '@/src/theme/themes';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import { AppTheme, ThemeCharacter } from '@/src/types';
import MascotViewer3DMini from '@/src/components/mascot/MascotViewer3DMini';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const theme = useAppTheme();
  const character = useCurrentCharacter();
  const student = useStudentStore((s) => s.student);
  const themeId = useThemeStore((s) => s.themeId);
  const characterId = useThemeStore((s) => s.characterId);
  const setThemeId = useThemeStore((s) => s.setTheme);
  const setCharacterId = useThemeStore((s) => s.setCharacter);
  const [showAllCharacters, setShowAllCharacters] = useState(false);

  const selectedTheme = useMemo(
    () => themes.find((t) => t.id === themeId) || themes[0],
    [themeId],
  );

  const allCharacters = useMemo(
    () => themes.flatMap((t) => t.characters),
    [],
  );

  const displayedCharacters = useMemo(
    () => (showAllCharacters ? allCharacters : selectedTheme.characters),
    [showAllCharacters, allCharacters, selectedTheme],
  );

  const toggleShowAll = useCallback(
    () => setShowAllCharacters((v) => !v),
    [],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.header, { color: theme.colors.text }]}>Профиль</Text>

        {/* Student Info */}
        <Card style={styles.infoCard}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: theme.colors.primary + '30' },
              ]}
            >
              <MascotViewer3DMini config3d={character.config3d} size={50} />
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

        {/* Character Selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Мой персонаж
        </Text>
        <View style={styles.charactersGrid}>
          {displayedCharacters.map((char: ThemeCharacter) => (
            <CharacterCard
              key={char.id}
              char={char}
              isSelected={char.id === characterId}
              theme={theme}
              onSelect={setCharacterId}
            />
          ))}
        </View>
        <TouchableOpacity
          onPress={toggleShowAll}
          style={[styles.showAllBtn, { borderColor: theme.colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.showAllText, { color: theme.colors.primary }]}>
            {showAllCharacters ? 'Только из текущей темы' : 'Все персонажи'}
          </Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
}

// Memoized character card - only re-renders when selection changes
const CharacterCard = memo(function CharacterCard({
  char,
  isSelected,
  theme,
  onSelect,
}: {
  char: ThemeCharacter;
  isSelected: boolean;
  theme: AppTheme;
  onSelect: (id: string) => void;
}) {
  const handlePress = useCallback(() => onSelect(char.id), [onSelect, char.id]);

  return (
    <TouchableOpacity
      style={[
        styles.characterCard,
        {
          backgroundColor: isSelected
            ? theme.colors.primary + '20'
            : theme.colors.surface,
          borderColor: isSelected
            ? theme.colors.primary
            : theme.colors.border,
          borderWidth: isSelected ? 2.5 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MascotViewer3DMini config3d={char.config3d} size={50} />
      <Text
        style={[
          styles.characterNameText,
          {
            color: isSelected
              ? theme.colors.primary
              : theme.colors.text,
            fontWeight: isSelected ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {char.name}
      </Text>
    </TouchableOpacity>
  );
});

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
  header: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
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

  // Characters
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  characterCard: {
    width: (SCREEN_WIDTH - 40 - 24) / 2,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  characterNameText: {
    fontSize: 14,
    textAlign: 'center',
  },
  showAllBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  showAllText: {
    fontSize: 13,
    fontWeight: '600',
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
