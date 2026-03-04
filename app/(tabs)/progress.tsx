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
import { mockClassmates, mockDuels } from '@/src/data/mockData';
import AchievementBadge from '@/src/components/achievements/AchievementBadge';
import LeaderboardRow from '@/src/components/achievements/LeaderboardRow';
import Card from '@/src/components/ui/Card';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

const DUEL_STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Ожидание',
  active: '⚔️ В процессе',
  won: '🏆 Победа',
  lost: '😞 Поражение',
};

export default function ProgressScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const achievements = useAchievementStore((s) => s.achievements);
  const student = useStudentStore((s) => s.student);

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

        {/* Duels */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Дуэли</Text>
        {mockDuels.map((duel) => (
          <Card key={duel.id} style={styles.duelCard}>
            <View style={styles.duelHeader}>
              <Text style={[styles.duelOpponent, { color: theme.colors.text }]}>
                {duel.opponentName}
              </Text>
              <Text style={[styles.duelStatus, { color: theme.colors.textSecondary }]}>
                {DUEL_STATUS_LABEL[duel.status] || duel.status}
              </Text>
            </View>
            <Text style={[styles.duelSubject, { color: theme.colors.textSecondary }]}>
              {duel.subject}
            </Text>
            {duel.score && (
              <Text style={[styles.duelScore, { color: theme.colors.accent }]}>
                Счёт: {duel.score.student} — {duel.score.opponent}
              </Text>
            )}
          </Card>
        ))}

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
  duelCard: {
    marginBottom: 10,
  },
  duelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  duelOpponent: {
    fontSize: 15,
    fontWeight: '600',
  },
  duelStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  duelSubject: {
    fontSize: 13,
    marginBottom: 4,
  },
  duelScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 100,
  },
});
