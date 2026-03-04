import React from 'react';
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
import { useArenaStore } from '@/src/stores/arenaStore';
import { mockClassmates } from '@/src/data/mockData';
import AchievementBadge from '@/src/components/achievements/AchievementBadge';
import LeaderboardRow from '@/src/components/achievements/LeaderboardRow';
import Card from '@/src/components/ui/Card';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

export default function ProgressScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const achievements = useAchievementStore((s) => s.achievements);
  const student = useStudentStore((s) => s.student);
  const getDuelStats = useArenaStore((s) => s.getDuelStats);
  const arenaStats = getDuelStats();

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

        {/* Achievements */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Мои достижения
        </Text>
        <FlatList
          data={achievements}
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
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Арена</Text>
        <Card style={styles.arenaCard} onPress={() => router.push('/(tabs)/arena')}>
          <Text style={styles.arenaEmoji}>⚔️</Text>
          <View style={styles.arenaContent}>
            <Text style={[styles.arenaTitle, { color: theme.colors.text }]}>Арена</Text>
            <Text style={[styles.arenaStats, { color: theme.colors.textSecondary }]}>
              {arenaStats.wins} побед · {arenaStats.losses} поражений · {arenaStats.active} активных
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
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
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
  arenaStats: {
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
