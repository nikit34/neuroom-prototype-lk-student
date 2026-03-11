import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import ComparisonBlock from '@/src/components/homework/ComparisonBlock';
import Button from '@/src/components/ui/Button';
import { getGradeEmoji, getGradeLabel } from '@/src/utils/gradeHelpers';
import { formatDateShortRu } from '@/src/utils/dateHelpers';

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const assignments = useHomeworkStore((s) => s.assignments);
  const markCheckedViewed = useHomeworkStore((s) => s.markCheckedViewed);
  const homework = assignments.find((a) => a.id === id);

  useEffect(() => {
    if (homework && (homework.status === 'graded' || homework.status === 'ai_reviewed')) {
      markCheckedViewed(homework.id);
    }
  }, [homework?.id, homework?.status]);

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

  const studentPhotos = homework.submissions.flatMap((sub) =>
    sub.files.filter((f) => f.type === 'photo').map((f) => f.uri)
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentGraded}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.gradedContainer, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <Text style={[styles.gradedHeaderTitle, { color: theme.colors.text }]}>
            Оценка и обратная связь
          </Text>

          {/* Subject badge + Date */}
          <View style={styles.titleCenter}>
            <View
              style={[
                styles.subjectBadge,
                { backgroundColor: theme.colors.primary + '33' },
              ]}
            >
              <Text style={[styles.subjectBadgeText, { color: theme.colors.textSecondary }]}>
                {homework.subject}
              </Text>
            </View>
            <Text style={[styles.gradedTitle, { color: theme.colors.text }]}>
              Задание от {formatDateShortRu(homework.createdAt)}
            </Text>
          </View>

          {/* Grade card — purple bar + sticker area */}
          {homework.grade !== undefined && (
            <View style={styles.gradeCardNew}>
              <View
                style={[styles.gradeBar, { backgroundColor: theme.colors.primary }]}
              >
                <View style={styles.gradeBarInner}>
                  <Text style={styles.gradeBarText}>Твоя оценка :</Text>
                  <View style={[styles.gradeNumberBox, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.gradeNumber, { color: theme.colors.primary }]}>
                      {homework.grade}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.stickerArea, { backgroundColor: theme.colors.surface }]}>
                <Text style={styles.stickerEmoji}>
                  {getGradeEmoji(homework.grade, homework.maxGrade)}
                </Text>
                <View style={styles.stickerTextWrap}>
                  <Text style={[styles.stickerText, { color: theme.colors.text }]}>
                    {getGradeLabel(homework.grade, homework.maxGrade)}!
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Feedback card — Резюме */}
          {(homework.aiFeedback || homework.teacherFeedback) && (
            <View style={[styles.feedbackCardNew, { backgroundColor: theme.colors.surface }]}>
              <View
                style={[
                  styles.feedbackBadge,
                  { backgroundColor: theme.colors.primary + '33' },
                ]}
              >
                <Text style={[styles.feedbackBadgeText, { color: theme.colors.text }]}>
                  Резюме по этой работе:
                </Text>
              </View>
              <Text style={[styles.feedbackText, { color: theme.colors.text }]}>
                {homework.aiFeedback || homework.teacherFeedback}
              </Text>
            </View>
          )}

          {/* Comparison: student vs correct */}
          {homework.comparisonItems && homework.comparisonItems.length > 0 && (
            <ComparisonBlock items={homework.comparisonItems} />
          )}

          {/* Твое фото */}
          {studentPhotos.length > 0 && (
            <View style={styles.yourPhotoSection}>
              <Text style={[styles.yourPhotoTitle, { color: theme.colors.text }]}>
                Твое фото
              </Text>
              <View style={[styles.yourPhotoContainer, { backgroundColor: theme.colors.surface }]}>
                <Image
                  source={{ uri: studentPhotos[0] }}
                  style={styles.yourPhotoImage}
                />
                <View
                  style={[
                    styles.expandPhotoBtn,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={styles.expandPhotoBtnIcon}>⤢</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Назад к списку ДЗ"
              icon="📚"
              variant="outline"
              onPress={() => router.replace('/(tabs)/homework')}
            />
          </View>
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
  contentGraded: {},
  gradedContainer: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  gradedHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  titleCenter: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  subjectBadge: {
    paddingHorizontal: 4,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center',
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  gradedTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
  },
  gradeCardNew: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gradeBar: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeBarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 26,
  },
  gradeNumberBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeNumber: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  stickerArea: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  stickerEmoji: {
    fontSize: 60,
  },
  stickerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  stickerText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  feedbackCardNew: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  feedbackBadge: {
    paddingHorizontal: 8,
    paddingBottom: 1,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center',
  },
  feedbackBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  yourPhotoSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  yourPhotoTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  yourPhotoContainer: {
    borderRadius: 12,
    padding: 16,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  yourPhotoImage: {
    width: 120,
    height: 119,
    borderRadius: 3,
  },
  expandPhotoBtn: {
    position: 'absolute',
    bottom: 8,
    right: 7,
    width: 32,
    height: 32,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandPhotoBtnIcon: {
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
