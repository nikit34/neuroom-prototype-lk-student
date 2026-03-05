import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAchievementStore } from '@/src/stores/achievementStore';
import { useStudentStore } from '@/src/stores/studentStore';
import { AchievementCategory } from '@/src/types';
import { mockClassmates } from '@/src/data/mockData';
import AchievementBadge from '@/src/components/achievements/AchievementBadge';
import LeaderboardRow from '@/src/components/achievements/LeaderboardRow';
import Card from '@/src/components/ui/Card';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

type CategoryFilter = 'all' | 'unlocked' | AchievementCategory;

const CATEGORY_TABS: { key: CategoryFilter; label: string; emoji: string }[] = [
  { key: 'all', label: 'Все', emoji: '🏅' },
  { key: 'unlocked', label: 'Получено', emoji: '✅' },
  { key: 'homework', label: 'Домашка', emoji: '📝' },
  { key: 'early_streak', label: 'Ранняя сдача', emoji: '🚀' },
  { key: 'duel', label: 'Дуэли', emoji: '⚔️' },
  { key: 'team_quest', label: 'Квесты', emoji: '🤝' },
  { key: 'challenge', label: 'Испытания', emoji: '🏋️' },
];

export default function ProgressScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const achievements = useAchievementStore((s) => s.achievements);
  const student = useStudentStore((s) => s.student);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filtered = useMemo(
    () => {
      if (categoryFilter === 'all') return achievements;
      if (categoryFilter === 'unlocked') return achievements.filter((a) => !a.isLocked);
      return achievements.filter((a) => a.category === categoryFilter);
    },
    [achievements, categoryFilter],
  );

  const stats = useMemo(() => {
    const unlocked = achievements.filter((a) => !a.isLocked).length;
    return { unlocked, total: achievements.length };
  }, [achievements]);

  const sortedClassmates = [...mockClassmates].sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );
  const top10 = sortedClassmates.slice(0, 10);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.header, { color: theme.colors.text }]}>Прогресс</Text>

        {/* Achievement stats */}
        <Text style={[styles.achievementCount, { color: theme.colors.textSecondary }]}>
          {stats.unlocked} из {stats.total} достижений
        </Text>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {CATEGORY_TABS.map((tab) => {
            const active = categoryFilter === tab.key;
            const count = tab.key === 'all'
              ? achievements.length
              : tab.key === 'unlocked'
                ? achievements.filter((a) => !a.isLocked).length
                : achievements.filter((a) => a.category === tab.key).length;
            if (tab.key !== 'all' && tab.key !== 'unlocked' && count === 0) return null;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setCategoryFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Achievements grid */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={styles.achievementsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.achievementCell}
              onPress={() => router.push(`/achievements/${item.id}`)}
              activeOpacity={0.7}
            >
              <AchievementBadge achievement={item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.achievementsGrid}
          ListEmptyComponent={
            <Card>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Нет достижений в этой категории
              </Text>
            </Card>
          }
        />

        {/* Leaderboard */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Лидерборд
        </Text>
        <Card style={styles.leaderboardCard}>
          {top10.map((classmate, index) => (
            <LeaderboardRow
              key={classmate.id}
              name={`${classmate.firstName} ${classmate.lastName}`}
              points={classmate.totalPoints}
              avatarEmoji={classmate.avatarEmoji}
              rank={index + 1}
              isCurrentUser={classmate.totalPoints === student.totalPoints}
            />
          ))}
        </Card>

        {/* Arena link */}
        <Card style={styles.arenaCard} onPress={() => router.push('/(tabs)/arena')}>
          <Text style={styles.arenaEmoji}>⚔️</Text>
          <View style={styles.arenaContent}>
            <Text style={[styles.arenaTitle, { color: theme.colors.text }]}>Арена</Text>
            <Text style={[styles.arenaSubtitle, { color: theme.colors.textSecondary }]}>
              Дуэли, квесты и испытания
            </Text>
          </View>
          <Text style={[styles.arenaArrow, { color: theme.colors.textSecondary }]}>›</Text>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: 4,
  },
  achievementCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  // Category tabs
  tabsRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  tabEmoji: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Grid
  achievementsGrid: {
    gap: 8,
  },
  achievementsRow: {
    gap: 8,
  },
  achievementCell: {
    flex: 1,
    maxWidth: '33%',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  leaderboardCard: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  arenaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  arenaEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  arenaContent: {
    flex: 1,
  },
  arenaTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  arenaSubtitle: {
    fontSize: 13,
  },
  arenaArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  bottomSpacer: {
    height: 100,
  },
});
