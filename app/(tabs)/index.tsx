import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import Mascot from '@/src/components/mascot/Mascot';
import Card from '@/src/components/ui/Card';
import DeadlineIndicator from '@/src/components/homework/DeadlineIndicator';

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

  const firstPending = useMemo(() => {
    return assignments.find(
      (a) => a.status === 'pending' || a.status === 'resubmit',
    );
  }, [assignments]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
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
            <Card
              key={hw.id}
              style={styles.deadlineCard}
              onPress={() => router.push(`/homework/${hw.id}`)}
            >
              <Text style={[styles.hwTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {hw.title}
              </Text>
              <Text style={[styles.hwSubject, { color: theme.colors.textSecondary }]}>
                {hw.subject}
              </Text>
              <View style={styles.deadlineRow}>
                <DeadlineIndicator deadline={hw.deadline} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {firstPending && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push(`/homework/submit/${firstPending.id}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>📤</Text>
        </TouchableOpacity>
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
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
  },
});
