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
import type { Achievement, HomeworkAssignment } from '@/src/types';

/** Achievement IDs linked to homework subjects */
const SUBJECT_ACHIEVEMENT_IDS: Record<string, string[]> = {
  'Математика': ['ach-12'],
  'Русский язык': ['ach-13'],
  'Английский язык': ['ach-14'],
  'Физика': ['ach-15'],
  'История': ['ach-16'],
};

function getLinkedAchievement(
  hw: HomeworkAssignment,
  achievements: Achievement[],
): Achievement | null {
  const ids = SUBJECT_ACHIEVEMENT_IDS[hw.subject];
  if (!ids) return null;
  return achievements.find((a) => ids.includes(a.id) && a.isLocked && a.progress > 0) ?? null;
}

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
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
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

        {/* ── Streak & Level ── */}
        <View style={styles.statsRow}>
          <Card style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakValue, { color: theme.colors.text }]}>
              {student.currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
              дней подряд
            </Text>
          </Card>
          <Card style={styles.levelCard}>
            <Text style={styles.levelEmoji}>{rank.emoji}</Text>
            <Text style={[styles.levelTitle, { color: theme.colors.text }]}>
              {rank.title}
            </Text>
            <Text style={[styles.levelLabel, { color: theme.colors.textSecondary }]}>
              Ур. {level} · {currentLevelXp}/{xpForNextLevel}
            </Text>
            <ProgressBar
              progress={(currentLevelXp / xpForNextLevel) * 100}
              color={theme.colors.primary}
              height={4}
            />
          </Card>
        </View>

        {/* ── Nearest Achievement ── */}
        {nearestAchievement && (
          <TouchableOpacity
            style={[styles.achievementBanner, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => router.push(`/achievements/${nearestAchievement.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.achievementIcon}>{nearestAchievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {nearestAchievement.title}
              </Text>
              <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {nearestAchievement.description}
              </Text>
            </View>
            <Text style={[styles.achievementProgress, { color: theme.colors.primary }]}>
              {nearestAchievement.progress}%
            </Text>
          </TouchableOpacity>
        )}

        <Mascot health={student.mascotHealth} />

        {/* ── Deadlines ── */}
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
          upcomingDeadlines.map((hw) => {
            const linked = getLinkedAchievement(hw, achievements);
            return (
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
                    {linked && (
                      <TouchableOpacity
                        style={[styles.linkedBadge, { backgroundColor: theme.colors.surface }]}
                        onPress={() => router.push(`/achievements/${linked.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.linkedBadgeIcon}>{linked.icon}</Text>
                        <Text style={[styles.linkedBadgeText, { color: theme.colors.text }]} numberOfLines={1}>
                          {linked.title}
                        </Text>
                        <Text style={[styles.linkedBadgeProgress, { color: theme.colors.primary }]}>
                          {linked.progress}%
                        </Text>
                      </TouchableOpacity>
                    )}
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
            );
          })
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
  // ── Streak & Level row ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  streakEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  levelCard: {
    flex: 1.5,
    alignItems: 'center',
    paddingVertical: 14,
  },
  levelEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  levelLabel: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  // ── Achievement banner ──
  achievementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  achievementDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  achievementProgress: {
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
  // ── Deadline cards ──
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
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
    gap: 4,
  },
  linkedBadgeIcon: {
    fontSize: 14,
  },
  linkedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  linkedBadgeProgress: {
    fontSize: 11,
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
