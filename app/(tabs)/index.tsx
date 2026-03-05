import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { useAchievementStore } from '@/src/stores/achievementStore';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import ProgressBar from '@/src/components/ui/ProgressBar';
import DeadlineIndicator from '@/src/components/homework/DeadlineIndicator';
import ThemeBackground from '@/src/components/theme/ThemeBackground';
import { getLevel, HOMEWORK_XP_REWARD } from '@/src/utils/levelHelpers';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const student = useStudentStore((s) => s.student);
  const assignments = useHomeworkStore((s) => s.assignments);
  const achievements = useAchievementStore((s) => s.achievements);

  const { level, currentLevelXp, xpForNextLevel, rank } = getLevel(student.totalPoints);

  const nearestAchievement = useMemo(() => {
    return achievements
      .filter((a) => a.isLocked && a.progress > 0)
      .sort((a, b) => b.progress - a.progress)[0] ?? null;
  }, [achievements]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return assignments
      .filter(
        (a) =>
          (a.status === 'pending' || a.status === 'resubmit') &&
          a.deadline.getTime() >= now.getTime(),
      )
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 3);
  }, [assignments]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.greeting, { color: theme.colors.text }]}>
          {getGreeting()}, {student.firstName}! 👋
        </Text>

        <Card style={styles.statsCard}>
          <View style={styles.statsTopRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipEmoji}>🔥</Text>
              <Text style={[styles.statChipValue, { color: theme.colors.text }]}>
                {student.currentStreak}
              </Text>
              <Text style={[styles.statChipLabel, { color: theme.colors.textSecondary }]}>
                дней
              </Text>
            </View>
            <View style={[styles.statChipDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statChip}>
              <Text style={styles.statChipEmoji}>{rank.emoji}</Text>
              <Text style={[styles.statChipValue, { color: theme.colors.text }]}>
                {rank.title}
              </Text>
              <Text style={[styles.statChipLabel, { color: theme.colors.textSecondary }]}>
                Уровень {level} · {currentLevelXp}/{xpForNextLevel}
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={(currentLevelXp / xpForNextLevel) * 100}
            color={theme.colors.primary}
            height={6}
          />
          {nearestAchievement && (
            <TouchableOpacity
              style={styles.nearestAchievement}
              onPress={() => router.push(`/achievements/${nearestAchievement.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.nearestAchievementIcon}>{nearestAchievement.icon}</Text>
              <View style={styles.nearestAchievementInfo}>
                <Text style={[styles.nearestAchievementTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {nearestAchievement.title}
                </Text>
                <Text style={[styles.nearestAchievementDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {nearestAchievement.description}
                </Text>
              </View>
              <Text style={[styles.nearestAchievementProgress, { color: theme.colors.primary }]}>
                {nearestAchievement.progress}%
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        <Mascot health={student.mascotHealth} />

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Ближайшие дедлайны
        </Text>

        {upcomingDeadlines.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              🎉 Нет предстоящих дедлайнов!
            </Text>
          </Card>
        ) : (
          upcomingDeadlines.map((hw) => (
            <Card key={hw.id} style={styles.deadlineCard}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push(`/homework/${hw.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardInfo}>
                  <Text style={[styles.hwTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {hw.title}
                  </Text>
                  <View style={styles.hwSubRow}>
                    <Text style={[styles.hwSubject, { color: theme.colors.textSecondary }]}>
                      {hw.subject}
                    </Text>
                    <Text style={[styles.hwXp, { color: theme.colors.primary }]}>
                      +{HOMEWORK_XP_REWARD} опыта
                    </Text>
                  </View>
                  <DeadlineIndicator deadline={hw.deadline} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cameraBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push(`/homework/submit/${hw.id}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.cameraBtnIcon}>📸</Text>
                <Text style={styles.cameraBtnLabel}>Сдать</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  statsCard: {
    marginBottom: 4,
  },
  statsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
  },
  statChipEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  statChipValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statChipLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  statChipDivider: {
    width: 1,
    height: 36,
  },
  nearestAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  nearestAchievementIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  nearestAchievementInfo: {
    flex: 1,
  },
  nearestAchievementTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  nearestAchievementDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  nearestAchievementProgress: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  deadlineCard: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardInfo: {
    flex: 1,
  },
  hwTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  hwSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  hwSubject: {
    fontSize: 13,
  },
  hwXp: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 16,
  },
  cameraBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  cameraBtnIcon: {
    fontSize: 22,
  },
  cameraBtnLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
