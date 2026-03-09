import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { useAppealStore } from '@/src/stores/appealStore';
import { deepAnalysis } from '@/src/services/aiService';
import Card from '@/src/components/ui/Card';
import Button from '@/src/components/ui/Button';
import StatusChip from '@/src/components/ui/StatusChip';
import DeadlineIndicator from '@/src/components/homework/DeadlineIndicator';
import FeedbackBubble from '@/src/components/homework/FeedbackBubble';
import ComparisonBlock from '@/src/components/homework/ComparisonBlock';
import AppealBottomSheet from '@/src/components/homework/AppealBottomSheet';
import AppealStatusCard from '@/src/components/homework/AppealStatusCard';
import { getGradeColor, getGradeEmoji, getGradeLabel } from '@/src/utils/gradeHelpers';
import { formatDateRu } from '@/src/utils/dateHelpers';

export default function HomeworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const assignments = useHomeworkStore((s) => s.assignments);
  const homework = assignments.find((a) => a.id === id);
  const appeal = useAppealStore((s) => s.getAppeal(id!));
  const submitAppeal = useAppealStore((s) => s.submitAppeal);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [appealSheetVisible, setAppealSheetVisible] = useState(false);

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

        {/* Teacher attachments (photos) — only in non-graded flow */}
        {!isGraded && homework.attachments && homework.attachments.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Фото задания ({homework.attachments.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.attachmentsScroll}
              contentContainerStyle={styles.attachmentsContainer}
            >
              {homework.attachments
                .filter((a) => a.type === 'photo')
                .map((attachment, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setPreviewImage(attachment.uri)}
                  >
                    <Image
                      source={{ uri: attachment.uri }}
                      style={[styles.attachmentThumb, { borderColor: theme.colors.border }]}
                    />
                  </Pressable>
                ))}
            </ScrollView>
          </>
        )}

        {/* Fullscreen image preview */}
        <Modal visible={!!previewImage} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setPreviewImage(null)}
          >
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.modalClose}>Закрыть</Text>
          </Pressable>
        </Modal>

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

            {/* Comparison: student vs correct */}
            {homework.comparisonItems && homework.comparisonItems.length > 0 && (
              <ComparisonBlock items={homework.comparisonItems} />
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

            {/* Appeal status or dispute button */}
            {appeal ? (
              <View style={styles.actions}>
                <AppealStatusCard appeal={appeal} />
              </View>
            ) : (
              <View style={styles.actions}>
                <Button
                  title="Оспорить оценку"
                  icon="💬"
                  variant="outline"
                  onPress={() => setAppealSheetVisible(true)}
                />
              </View>
            )}

            {/* Deep analysis */}
            {(homework.aiFeedback || homework.teacherFeedback) && (
              <View style={{ marginBottom: 16 }}>
                <Button
                  title="Разобрать ошибки"
                  icon="🔍"
                  variant="secondary"
                  onPress={handleDeepAnalysis}
                  loading={analyzing}
                />
              </View>
            )}

            {/* Teacher attachments (photos) — in graded flow, after deep analysis */}
            {homework.attachments && homework.attachments.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Фото задания ({homework.attachments.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.attachmentsScroll}
                  contentContainerStyle={styles.attachmentsContainer}
                >
                  {homework.attachments
                    .filter((a) => a.type === 'photo')
                    .map((attachment, index) => (
                      <Pressable
                        key={index}
                        onPress={() => setPreviewImage(attachment.uri)}
                      >
                        <Image
                          source={{ uri: attachment.uri }}
                          style={[styles.attachmentThumb, { borderColor: theme.colors.border }]}
                        />
                      </Pressable>
                    ))}
                </ScrollView>
              </>
            )}

            {/* Appeal bottom sheet */}
            <AppealBottomSheet
              visible={appealSheetVisible}
              onClose={() => setAppealSheetVisible(false)}
              onSubmit={(data) => {
                submitAppeal({
                  homeworkId: homework.id,
                  disagreementPoints: data.disagreementPoints,
                  reviewType: data.reviewType,
                  comment: data.comment,
                  oldGrade: homework.grade ?? 0,
                });
                setAppealSheetVisible(false);
                Alert.alert(
                  'Запрос отправлен',
                  'Мы уведомим тебя, когда учитель примет решение',
                );
              }}
            />

            {/* Deadline */}
            <Card style={styles.infoCard}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Дедлайн
              </Text>
              <DeadlineIndicator deadline={homework.deadline} />
            </Card>
          </>
        )}

        {/* Non-graded flow */}
        {!isGraded && (
          <>
            {/* Resubmit reason */}
            {homework.status === 'resubmit' && (
              <>
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
                  </Card>
                )}
                {homework.comparisonItems && homework.comparisonItems.length > 0 && (
                  <ComparisonBlock items={homework.comparisonItems} />
                )}
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
                {homework.teacherFeedback && (
                  <FeedbackBubble
                    text={homework.teacherFeedback}
                    type="teacher"
                    timestamp={homework.createdAt}
                  />
                )}
              </>
            )}


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

            {/* Submissions — photo thumbnails */}
            {homework.submissions.length > 0 && (() => {
              const photos = homework.submissions.flatMap((sub) =>
                sub.files.filter((f) => f.type === 'photo').map((f) => f.uri)
              );
              return photos.length > 0 ? (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Фото решения
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.attachmentsScroll}
                    contentContainerStyle={styles.attachmentsContainer}
                  >
                    {photos.map((uri, index) => (
                      <Pressable key={index} onPress={() => setPreviewImage(uri)}>
                        <Image
                          source={{ uri }}
                          style={[styles.attachmentThumb, { borderColor: theme.colors.border }]}
                        />
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null;
            })()}
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
  attachmentsScroll: {
    marginBottom: 8,
  },
  attachmentsContainer: {
    gap: 10,
  },
  attachmentThumb: {
    width: 160,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#f0f0f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').height * 0.7,
  },
  modalClose: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    padding: 12,
  },
});
