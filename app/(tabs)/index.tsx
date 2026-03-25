import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { useAppVersionStore } from '@/src/config/appVersion';

import ThemeBackground from '@/src/components/theme/ThemeBackground';
import HomeworkCard from '@/src/components/homework/HomeworkCard';
import Mascot from '@/src/components/mascot/Mascot';
import MascotHealthBar from '@/src/components/mascot/MascotHealthBar';
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
  const homeLayout = useHomeworkStore((s) => s.homeLayout);
  const appVersion = useAppVersionStore((s) => s.appVersion);
  const age = useAgeStyles();

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

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    const graded = assignments.filter((a) => a.status === 'graded' && a.grade != null);
    const avgGrade = graded.length > 0
      ? Math.round(graded.reduce((sum, a) => sum + (a.grade! / a.maxGrade) * 100, 0) / graded.length)
      : null;
    const overdueCount = assignments.filter(
      (a) => (a.status === 'pending' || a.status === 'resubmit') && a.deadline.getTime() < Date.now(),
    ).length;
    const activeCount = assignments.filter(
      (a) => a.status === 'pending' || a.status === 'resubmit',
    ).length;
    const onReviewCount = assignments.filter(
      (a) => a.status === 'submitted' || a.status === 'ai_reviewed',
    ).length;
    return { avgGrade, overdueCount, gradedCount: graded.length, activeCount, onReviewCount };
  }, [assignments]);

  // Per-subject average grades for dashboard chart
  const subjectGrades = useMemo(() => {
    const graded = assignments.filter((a) => a.status === 'graded' && a.grade != null);
    const map: Record<string, { sum: number; count: number; maxGrade: number }> = {};
    for (const a of graded) {
      if (!map[a.subject]) map[a.subject] = { sum: 0, count: 0, maxGrade: a.maxGrade };
      map[a.subject].sum += a.grade!;
      map[a.subject].count += 1;
    }
    return Object.entries(map)
      .map(([subject, { sum, count, maxGrade }]) => ({
        subject,
        avg: +(sum / count).toFixed(1),
        maxGrade,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [assignments]);

  const { width: screenWidth } = useWindowDimensions();
  const mascotSize = Math.round(screenWidth * 0.3125);

  // ── Layout-specific hero sections ──

  const renderMascotHeader = () => (
    <View style={styles.mascotHeaderRow}>
      {/* Left: greeting + inline notifications */}
      <View style={styles.mascotHeaderLeft}>
        <Text style={[styles.greeting, { color: theme.colors.text, fontSize: age.greetingSize }]}>
          {getGreeting()}, {student.firstName}! 👋
        </Text>
      </View>
      {/* Right: mascot + health bar */}
      <View style={[styles.mascotHeaderRight, { width: mascotSize + 16 }]}>
        <Mascot health={student.mascotHealth} size={mascotSize} showHealthBar={false} compact />
        <View style={styles.mascotMiniHealthWrap}>
          <MascotHealthBar health={student.mascotHealth} />
        </View>
      </View>
    </View>
  );

  const renderDashboardHero = () => {
    const { overdueCount, activeCount, onReviewCount, gradedCount } = dashboardStats;
    const getBarColor = (avg: number, max: number) => {
      const pct = (avg / max) * 100;
      if (pct >= 80) return '#16A34A';
      if (pct >= 60) return '#F59E0B';
      return '#EF4444';
    };
    return (
      <View style={[styles.dashboardCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.dashboardCompactRow}>
          {/* Left: per-subject grade bars */}
          <View style={styles.dashboardGradesSection}>
            <Text style={[styles.dashboardGradesTitle, { color: theme.colors.textSecondary }]}>Средняя оценка за год</Text>
            {subjectGrades.length > 0 ? (
              subjectGrades.map((s) => {
                const pct = (s.avg / s.maxGrade) * 100;
                const color = getBarColor(s.avg, s.maxGrade);
                return (
                  <View key={s.subject} style={styles.chartRowCompact}>
                    <Text style={[styles.chartSubjectCompact, { color: theme.colors.text }]} numberOfLines={1}>{s.subject}</Text>
                    <View style={[styles.chartBarTrackCompact, { backgroundColor: theme.colors.border }]}>
                      <View style={[styles.chartBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={[styles.chartValueCompact, { color }]}>{s.avg}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={[styles.chartEmptyText, { color: theme.colors.textSecondary }]}>Нет оценок</Text>
            )}
          </View>
          {/* Right: numeric stats */}
          <View style={[styles.dashboardStatsDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.dashboardStatsColumn}>
            <View style={styles.dashboardStatCompact}>
              <Text style={[styles.dashboardStatCompactValue, { color: '#3B82F6' }]}>{activeCount}</Text>
              <Text style={[styles.dashboardStatCompactLabel, { color: theme.colors.textSecondary }]}>Активных</Text>
            </View>
            <View style={styles.dashboardStatCompact}>
              <Text style={[styles.dashboardStatCompactValue, { color: '#F59E0B' }]}>{onReviewCount}</Text>
              <Text style={[styles.dashboardStatCompactLabel, { color: theme.colors.textSecondary }]}>На проверке</Text>
            </View>
            <View style={styles.dashboardStatCompact}>
              <Text style={[styles.dashboardStatCompactValue, { color: '#16A34A' }]}>{gradedCount}</Text>
              <Text style={[styles.dashboardStatCompactLabel, { color: theme.colors.textSecondary }]}>Проверено</Text>
            </View>
            {overdueCount > 0 && (
              <View style={styles.dashboardStatCompact}>
                <Text style={[styles.dashboardStatCompactValue, { color: '#EF4444' }]}>{overdueCount}</Text>
                <Text style={[styles.dashboardStatCompactLabel, { color: theme.colors.textSecondary }]}>Просрочено</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { padding: age.contentPadding }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* ── Header: mascot layout has its own combined header ── */}
        {homeLayout === 'mascot' ? (
          renderMascotHeader()
        ) : (
          <View style={styles.headerRow}>
            <Text style={[styles.greeting, { color: theme.colors.text, fontSize: age.greetingSize }]}>
              {getGreeting()}, {student.firstName}! 👋
            </Text>
          </View>
        )}

        {/* ── Hero section based on layout ── */}
        {homeLayout === 'dashboard' && renderDashboardHero()}

        {/* ── Progress summary (all layouts, toggled via dev mode) ── */}
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
  // ── Mascot header (layout variant) ──
  mascotHeaderRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
    gap: 12,
  },
  mascotHeaderLeft: {
    flex: 1,
  },
  mascotHeaderRight: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mascotMiniHealthWrap: {
    width: '100%',
    marginTop: 4,
  },
  // ── Dashboard (layout variant) ──
  dashboardCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  dashboardCompactRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  dashboardGradesSection: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  dashboardGradesTitle: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  chartRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  chartSubjectCompact: {
    width: 70,
    fontSize: 11,
    fontWeight: '500',
  },
  chartBarTrackCompact: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartValueCompact: {
    width: 28,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  chartEmptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dashboardStatsDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  dashboardStatsColumn: {
    gap: 6,
    width: 110,
    flexShrink: 0,
    justifyContent: 'center',
  },
  dashboardStatCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dashboardStatCompactValue: {
    fontSize: 17,
    fontWeight: '800',
    width: 22,
    textAlign: 'right',
  },
  dashboardStatCompactLabel: {
    fontSize: 11,
    fontWeight: '500',
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
