import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import FeedbackBubble from '@/src/components/homework/FeedbackBubble';
import ComparisonBlock from '@/src/components/homework/ComparisonBlock';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import { getGradeColor, getGradeEmoji, getGradeLabel } from '@/src/utils/gradeHelpers';

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const assignments = useHomeworkStore((s) => s.assignments);
  const homework = assignments.find((a) => a.id === id);

  if (!homework) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Задание не найдено
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Обратная связь
        </Text>
        <Text style={[styles.hwTitle, { color: theme.colors.textSecondary }]}>
          {homework.subject}
        </Text>

        {/* Grade if available */}
        {homework.grade !== undefined && (
          <Card style={styles.gradeCard}>
            <Text style={[styles.gradeTitle, { color: theme.colors.text }]}>
              Оценка
            </Text>
            <View style={styles.gradeRow}>
              <Text style={styles.gradeEmoji}>
                {getGradeEmoji(homework.grade, homework.maxGrade)}
              </Text>
              <Text
                style={[
                  styles.gradeValue,
                  { color: getGradeColor(homework.grade, homework.maxGrade) },
                ]}
              >
                {homework.grade}/{homework.maxGrade}
              </Text>
            </View>
            <Text style={[styles.gradeLabel, { color: theme.colors.textSecondary }]}>
              {getGradeLabel(homework.grade, homework.maxGrade)}
            </Text>
          </Card>
        )}

        {/* Comparison: student vs correct */}
        {homework.comparisonItems && homework.comparisonItems.length > 0 && (
          <ComparisonBlock items={homework.comparisonItems} />
        )}

        {/* AI Feedback */}
        {homework.aiFeedback ? (
          <FeedbackBubble
            text={homework.aiFeedback}
            type="ai"
            timestamp={
              homework.submissions.length > 0
                ? homework.submissions[homework.submissions.length - 1].submittedAt
                : new Date()
            }
          />
        ) : (
          <Card style={styles.noFeedback}>
            <Text style={styles.noFeedbackEmoji}>🤖</Text>
            <Text style={[styles.noFeedbackText, { color: theme.colors.textSecondary }]}>
              ИИ-отзыв пока отсутствует
            </Text>
          </Card>
        )}

        {/* Teacher Feedback */}
        {homework.teacherFeedback ? (
          <FeedbackBubble
            text={homework.teacherFeedback}
            type="teacher"
            timestamp={homework.createdAt}
          />
        ) : (
          <Card style={styles.noFeedback}>
            <Text style={styles.noFeedbackEmoji}>👨‍🏫</Text>
            <Text style={[styles.noFeedbackText, { color: theme.colors.textSecondary }]}>
              Учитель ещё не оставил отзыв
            </Text>
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Назад к списку ДЗ"
            icon="📚"
            variant="outline"
            onPress={() => router.replace('/(tabs)/homework')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  hwTitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  gradeCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  gradeValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  gradeLabel: {
    fontSize: 14,
    marginTop: 6,
  },
  noFeedback: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 12,
  },
  noFeedbackEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  noFeedbackText: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
