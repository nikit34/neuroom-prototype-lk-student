import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { useAchievementStore } from '@/src/stores/achievementStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import DeadlineIndicator from '@/src/components/homework/DeadlineIndicator';
import ThemeBackground from '@/src/components/theme/ThemeBackground';
import MascotHealthBar from '@/src/components/mascot/MascotHealthBar';
import type { Achievement, HomeworkAssignment } from '@/src/types';

/** Achievement IDs linked to homework subjects + how much each HW contributes */
const SUBJECT_ACHIEVEMENT_MAP: Record<string, { ids: string[]; contribution: number }> = {
  'Математика': { ids: ['ach-12'], contribution: 20 },
  'Русский язык': { ids: ['ach-13'], contribution: 20 },
  'Английский язык': { ids: ['ach-14'], contribution: 33 },
  'Физика': { ids: ['ach-15'], contribution: 25 },
  'История': { ids: ['ach-16'], contribution: 20 },
};

type LinkedReward = { achievement: Achievement; contribution: number };

function getLinkedReward(
  hw: HomeworkAssignment,
  achievements: Achievement[],
): LinkedReward | null {
  const entry = SUBJECT_ACHIEVEMENT_MAP[hw.subject];
  if (!entry) return null;
  const achievement = achievements.find((a) => entry.ids.includes(a.id) && a.isLocked && a.progress > 0) ?? null;
  if (!achievement) return null;
  return { achievement, contribution: entry.contribution };
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

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 3);
  }, [notifications]);

  const { height: screenHeight } = useWindowDimensions();
  const topBlockHeight = Math.round(screenHeight / 5);

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

        {/* ── Mascot + Health row ── */}
        <View style={[styles.topRow, { height: topBlockHeight }]}>
          <Card style={styles.notifCard}>
            <View style={styles.notifHeader}>
              <Text style={[styles.notifTitle, { color: theme.colors.text }]}>
                Уведомления
              </Text>
              {unreadCount() > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.notifBadgeText}>{unreadCount()}</Text>
                </View>
              )}
            </View>
            {recentNotifications.length === 0 ? (
              <Text style={[styles.notifEmpty, { color: theme.colors.textSecondary }]}>
                Нет новых уведомлений
              </Text>
            ) : (
              recentNotifications.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notifItem,
                    { backgroundColor: notif.isRead ? 'transparent' : theme.colors.primary + '10' },
                  ]}
                  onPress={() => {
                    markAsRead(notif.id);
                    if (notif.route) router.push(notif.route as any);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.notifIcon}>{notif.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.notifItemTitle,
                        { color: theme.colors.text, fontWeight: notif.isRead ? '500' : '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {notif.title}
                    </Text>
                    <Text
                      style={[styles.notifItemMsg, { color: theme.colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {notif.message}
                    </Text>
                  </View>
                  {!notif.isRead && (
                    <View style={[styles.notifDot, { backgroundColor: theme.colors.primary }]} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </Card>
          <View style={[styles.mascotColumn, { width: topBlockHeight }]}>
            <View style={[styles.mascotContainer, { flex: 1 }]}>
              <Mascot health={student.mascotHealth} showHealthBar={false} size={Math.round(topBlockHeight / 2)} compact />
            </View>
            <View style={styles.mascotHealth}>
              <MascotHealthBar health={student.mascotHealth} />
            </View>
          </View>
        </View>

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
            const reward = getLinkedReward(hw, achievements);
            const willComplete = reward && (reward.achievement.progress + reward.contribution >= 100);
            return (
              <Card key={hw.id} style={styles.deadlineCard}>
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={() => router.push(`/homework/${hw.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardInfo}>
                    <Text style={[styles.hwTitle, { color: theme.colors.text }]} numberOfLines={1}>
                      {hw.subject}
                    </Text>
                    <Text style={[styles.hwSubject, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                      {hw.description.split('\n')[0]}
                    </Text>
                    {reward ? (
                      <TouchableOpacity
                        style={[styles.rewardHint, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '40' }]}
                        onPress={() => router.push(`/achievements/${reward.achievement.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.rewardHintIcon}>{reward.achievement.icon}</Text>
                        <View style={styles.rewardHintBody}>
                          <Text style={[styles.rewardHintText, { color: theme.colors.primary }]} numberOfLines={1}>
                            {willComplete
                              ? `Выполни и получи награду «${reward.achievement.title}»!`
                              : `+${reward.contribution}% к награде «${reward.achievement.title}»`}
                          </Text>
                          <View style={[styles.rewardBar, { backgroundColor: theme.colors.border }]}>
                            <View
                              style={[styles.rewardBarFill, {
                                width: `${reward.achievement.progress}%`,
                                backgroundColor: theme.colors.primary,
                              }]}
                            />
                            <View
                              style={[styles.rewardBarGain, {
                                width: `${Math.min(reward.contribution, 100 - reward.achievement.progress)}%`,
                                backgroundColor: theme.colors.primary + '50',
                              }]}
                            />
                          </View>
                          <Text style={[styles.rewardBarLabel, { color: theme.colors.textSecondary }]}>
                            {reward.achievement.progress}% → {Math.min(reward.achievement.progress + reward.contribution, 100)}%
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.rewardHint, { backgroundColor: theme.colors.success + '10', borderColor: theme.colors.success + '40' }]}>
                        <Text style={styles.rewardHintIcon}>💚</Text>
                        <Text style={[styles.rewardHintText, { color: theme.colors.success }]} numberOfLines={2}>
                          Сдай вовремя и получи +Здоровье маскоту
                        </Text>
                      </View>
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
  // ── Top row ──
  topRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  notifCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  notifBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  notifEmpty: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    marginBottom: 2,
  },
  notifIcon: {
    fontSize: 16,
  },
  notifItemTitle: {
    fontSize: 11,
  },
  notifItemMsg: {
    fontSize: 9,
  },
  notifDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  mascotColumn: {
    justifyContent: 'flex-end',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 16,
  },
  mascotHealth: {
    paddingHorizontal: 4,
    paddingBottom: 2,
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
  rewardHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 6,
    gap: 6,
  },
  rewardHintIcon: {
    fontSize: 14,
  },
  rewardHintBody: {
    flex: 1,
  },
  rewardHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rewardBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 4,
  },
  rewardBarFill: {
    height: 6,
  },
  rewardBarGain: {
    height: 6,
  },
  rewardBarLabel: {
    fontSize: 9,
    marginTop: 2,
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
