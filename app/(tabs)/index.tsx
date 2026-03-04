import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import DeadlineIndicator from '@/src/components/homework/DeadlineIndicator';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

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
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Серия: {student.currentStreak} дней 🔥 | {student.totalPoints} XP
        </Text>

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
                  <Text style={[styles.hwSubject, { color: theme.colors.textSecondary }]}>
                    {hw.subject}
                  </Text>
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
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
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
  hwSubject: {
    fontSize: 13,
    marginBottom: 8,
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
