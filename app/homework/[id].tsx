import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { deepAnalysis } from '@/src/services/aiService';
import Card from '@/src/components/ui/Card';
import Button from '@/src/components/ui/Button';
import StatusChip from '@/src/components/ui/StatusChip';
import DeadlineIndicator from '@/src/components/homework/DeadlineIndicator';
import FeedbackBubble from '@/src/components/homework/FeedbackBubble';
import { getGradeColor, getGradeEmoji, getGradeLabel } from '@/src/utils/gradeHelpers';
import { formatDateRu } from '@/src/utils/dateHelpers';

export default function HomeworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const assignments = useHomeworkStore((s) => s.assignments);
  const homework = assignments.find((a) => a.id === id);
  const [analyzing, setAnalyzing] = useState(false);

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

  const isGraded = homework.status === 'graded' || homework.status === 'disputed';
  const canSubmit =
    homework.status === 'pending' || homework.status === 'resubmit';

  const handleDeepAnalysis = async () => {
    setAnalyzing(true);
    try {
      await deepAnalysis(homework.id);
    } catch {
      // Premium alert shown by the service
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <StatusChip status={homework.status} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {homework.subject}
        </Text>

        {/* Description (задание) */}
        <Text style={[styles.description, { color: theme.colors.text }]}>
          {homework.description}
        </Text>

        {/* Graded flow */}
        {isGraded && (
          <>
            {/* Grade */}
            {homework.grade !== undefined && (
              <Card style={styles.gradeCard}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 0 }]}>
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

            {/* AI Feedback */}
            {homework.aiFeedback && (
              <FeedbackBubble
                text={homework.aiFeedback}
                type="ai"
                timestamp={
                  homework.submissions.length > 0
                    ? homework.submissions[homework.submissions.length - 1].submittedAt
                    : homework.createdAt
                }
              />
            )}

            {/* Teacher Feedback */}
            {homework.teacherFeedback && (
              <FeedbackBubble
                text={homework.teacherFeedback}
                type="teacher"
                timestamp={homework.createdAt}
              />
            )}

            {/* Dispute + Deep analysis */}
            <View style={styles.actions}>
              <Button
                title="Оспорить оценку"
                icon="💬"
                variant="outline"
                onPress={() =>
                  router.push(
                    `/chat/${homework.teacher.id}?dispute=true&hwTitle=${encodeURIComponent(homework.subject)}&grade=${homework.grade}/${homework.maxGrade}`,
                  )
                }
              />
              {(homework.aiFeedback || homework.teacherFeedback) && (
                <View style={styles.actionGap}>
                  <Button
                    title="Разобрать ошибки"
                    icon="🔍"
                    variant="secondary"
                    onPress={handleDeepAnalysis}
                    loading={analyzing}
                  />
                </View>
              )}
            </View>

            {/* Submissions */}
            {homework.submissions.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Мои ответы ({homework.submissions.length})
                </Text>
                {homework.submissions.map((sub) => (
                  <Card key={sub.id} style={styles.submissionCard}>
                    <View style={styles.submissionRow}>
                      <Text style={styles.submissionIcon}>
                        {sub.fileType === 'photo' ? '📸' : '📄'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.submissionType, { color: theme.colors.text }]}>
                          {sub.fileType === 'photo' ? 'Фотография' : 'Документ'}
                        </Text>
                        <Text style={[styles.submissionDate, { color: theme.colors.textSecondary }]}>
                          {formatDateRu(sub.submittedAt)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* Deadline + Submitted date */}
            <Card style={styles.infoCard}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Дедлайн
              </Text>
              <DeadlineIndicator deadline={homework.deadline} />
            </Card>
            {homework.submissions.length > 0 && (
              <Card style={styles.infoCard}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Сдано
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {formatDateRu(homework.submissions[homework.submissions.length - 1].submittedAt)}
                </Text>
              </Card>
            )}
          </>
        )}

        {/* Non-graded flow */}
        {!isGraded && (
          <>
            {/* Actions */}
            <View style={styles.actions}>
              {canSubmit && (
                <Button
                  title="Сдать работу"
                  icon="📤"
                  onPress={() => router.push(`/homework/submit/${homework.id}`)}
                />
              )}
            </View>

            {/* Deadline */}
            <Card style={styles.infoCard}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Дедлайн
              </Text>
              <DeadlineIndicator deadline={homework.deadline} />
            </Card>

            {/* Submissions */}
            {homework.submissions.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Мои ответы ({homework.submissions.length})
                </Text>
                {homework.submissions.map((sub) => (
                  <Card key={sub.id} style={styles.submissionCard}>
                    <View style={styles.submissionRow}>
                      <Text style={styles.submissionIcon}>
                        {sub.fileType === 'photo' ? '📸' : '📄'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.submissionType, { color: theme.colors.text }]}>
                          {sub.fileType === 'photo' ? 'Фотография' : 'Документ'}
                        </Text>
                        <Text style={[styles.submissionDate, { color: theme.colors.textSecondary }]}>
                          {formatDateRu(sub.submittedAt)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
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
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoCard: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  submissionCard: {
    marginBottom: 8,
  },
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  submissionType: {
    fontSize: 14,
    fontWeight: '600',
  },
  submissionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  gradeCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 20,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    marginBottom: 16,
  },
  actionGap: {
    marginTop: 10,
  },
  bottomSpacer: {
    height: 40,
  },
});
