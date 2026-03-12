import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { useAppVersionStore } from '@/src/config/appVersion';
import ThemeBackground from '@/src/components/theme/ThemeBackground';
import HomeworkCard from '@/src/components/homework/HomeworkCard';
import Mascot from '@/src/components/mascot/Mascot';
import { useChatStore } from '@/src/stores/chatStore';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';

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
  const devHideHomework = useHomeworkStore((s) => s.devHideHomework);
  const devShowProgressSummary = useHomeworkStore((s) => s.devShowProgressSummary);
  const appVersion = useAppVersionStore((s) => s.appVersion);
  const age = useAgeStyles();

  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const teacherChatEnabled = useChatStore((s) => s.teacherChatEnabled);

  const recentNotifications = useMemo(() => {
    const PRIORITY: Record<string, number> = {
      homework_new: 0,
      homework_graded: 0,
      homework_mark: 0,
      duel_challenge: 1,
      duel_result: 1,
      achievement: 2,
      chat_reply: 3,
    };
    const filtered = teacherChatEnabled
      ? notifications
      : notifications.filter((n) => n.type !== 'chat_reply');
    return [...filtered].sort(
      (a, b) => (PRIORITY[a.type] ?? 9) - (PRIORITY[b.type] ?? 9),
    );
  }, [notifications, teacherChatEnabled]);

  const filteredUnreadCount = useMemo(
    () => recentNotifications.filter((n) => !n.isRead).length,
    [recentNotifications],
  );

  const [bellOpen, setBellOpen] = useState(false);

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

  const { doneCount, totalCount, progressPercent } = useMemo(() => {
    const total = assignments.length;
    const done = assignments.filter(
      (a) => a.status === 'graded' || a.status === 'ai_reviewed' || a.status === 'submitted',
    ).length;
    return {
      doneCount: done,
      totalCount: total,
      progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, [assignments]);

  const progressSummary = useMemo(() => {
    const graded = assignments.filter((a) => a.status === 'graded' && a.grade != null);
    const avgGrade =
      graded.length > 0
        ? graded.reduce((sum, a) => sum + (a.grade! / a.maxGrade) * 100, 0) / graded.length
        : null;
    const overdueCount = assignments.filter(
      (a) =>
        (a.status === 'pending' || a.status === 'resubmit') &&
        a.deadline.getTime() < Date.now(),
    ).length;

    if (avgGrade !== null && avgGrade >= 80 && overdueCount === 0) {
      return 'Ты отлично усваиваешь материал! Главное — будь предельно внимателен. Одна потерянная цифра или пропущенное задание в упражнении может изменить итоговую оценку.';
    }
    if (avgGrade !== null && avgGrade >= 60) {
      return 'Хороший темп! Обрати внимание на задания, где были ошибки — разбор ошибок поможет закрепить материал и поднять средний балл.';
    }
    if (overdueCount > 0) {
      return `У тебя есть просроченные задания (${overdueCount}). Постарайся сдать их как можно скорее — это поможет не накапливать долги и сохранить хорошую оценку.`;
    }
    return 'Продолжай в том же духе! Регулярное выполнение заданий — залог отличных результатов. Не откладывай на последний момент.';
  }, [assignments]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { padding: age.contentPadding }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* ── Header: greeting + bell ── */}
        <View style={styles.headerRow}>
          <Text style={[styles.greeting, { color: theme.colors.text, fontSize: age.greetingSize }]}>
            {getGreeting()}, {student.firstName}! 👋
          </Text>
          {appVersion >= 1 && (
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setBellOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={26} color={theme.colors.text} />
              {filteredUnreadCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.bellBadgeText}>{filteredUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Progress bar ── */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, { color: theme.colors.text, fontSize: age.progressLabelSize }]}>
              {age.isJunior ? '⭐ Твой прогресс' : 'Твой прогресс'}
            </Text>
            <Text style={[styles.progressValue, { color: theme.colors.primary, fontSize: age.progressLabelSize }]}>
              {doneCount}/{totalCount}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.border, height: age.progressTrackHeight, borderRadius: age.progressTrackHeight / 2 }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: theme.colors.primary, borderRadius: age.progressTrackHeight / 2 },
              ]}
            />
          </View>
        </View>

        {/* ── Progress summary (V1+) ── */}
        {appVersion >= 1 && devShowProgressSummary && (
          <View style={[styles.summaryContainer, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30', borderRadius: age.cardBorderRadius }]}>
            <Ionicons name="bulb-outline" size={age.isJunior ? 22 : 18} color={theme.colors.primary} style={styles.summaryIcon} />
            <Text style={[styles.summaryText, { color: theme.colors.textSecondary, fontSize: age.isJunior ? 15 : 13, lineHeight: age.isJunior ? 22 : 19 }]}>
              {progressSummary}
            </Text>
          </View>
        )}

        {/* ── Active assignments ── */}
        {(!devHideHomework && upcomingDeadlines.length > 0) ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: age.sectionTitleSize }]}>
              {age.isJunior ? '📋 Активные задания' : 'Активные задания'}
            </Text>
            {upcomingDeadlines.map((hw) => (
              <HomeworkCard
                key={hw.id}
                homework={hw}
                onPress={() => router.push(`/homework/${hw.id}`)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Mascot health={student.mascotHealth} emotion="happy" size={age.emptyMascotSize} compact />
            <Text style={[styles.emptyTitle, { color: theme.colors.text, fontSize: age.isJunior ? 26 : 22 }]}>
              {age.isJunior ? '🎉 На сегодня всё!' : 'На сегодня всё!'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary, fontSize: age.bodySize }]}>
              {age.isJunior ? 'Можешь отдыхать, ты супер-молодец! 🌟' : 'Можешь отдыхать, ты большой молодец!'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Notifications dropdown (modal) ── */}
      {appVersion >= 1 && bellOpen && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setBellOpen(false)}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setBellOpen(false)}
          >
            <View
              style={[styles.notifDropdown, { backgroundColor: theme.colors.surface }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, { color: theme.colors.text }]}>Уведомления</Text>
                <TouchableOpacity onPress={() => setBellOpen(false)}>
                  <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {recentNotifications.length === 0 ? (
                <Text style={[styles.notifEmpty, { color: theme.colors.textSecondary }]}>
                  Всё прочитано
                </Text>
              ) : (
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  {recentNotifications.map((notif) => (
                    <TouchableOpacity
                      key={notif.id}
                      style={[
                        styles.notifItem,
                        { backgroundColor: notif.isRead ? 'transparent' : theme.colors.primary + '10' },
                      ]}
                      onPress={() => {
                        markAsRead(notif.id);
                        setBellOpen(false);
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
                  ))}
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    flex: 1,
  },
  bellBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  // ── Notification dropdown ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  notifDropdown: {
    borderRadius: 16,
    padding: 14,
    maxHeight: '70%',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notifTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  notifScroll: {
    flex: 1,
  },
  notifEmpty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
    marginBottom: 4,
  },
  notifIcon: {
    fontSize: 20,
  },
  notifItemTitle: {
    fontSize: 14,
  },
  notifItemMsg: {
    fontSize: 12,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // ── Progress bar ──
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  summaryIcon: {
    marginTop: 1,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
});
