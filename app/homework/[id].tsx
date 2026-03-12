import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Pressable,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { AI_TUTOR_ID } from '@/src/stores/chatStore';
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
import { formatDateShortRu } from '@/src/utils/dateHelpers';

export default function HomeworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const assignments = useHomeworkStore((s) => s.assignments);
  const homework = assignments.find((a) => a.id === id);
  const appeal = useAppealStore((s) => s.getAppeal(id!));
  const getErrorAppeal = useAppealStore((s) => s.getErrorAppeal);
  const submitAppeal = useAppealStore((s) => s.submitAppeal);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const markCheckedViewed = useHomeworkStore((s) => s.markCheckedViewed);
  const [appealSheetVisible, setAppealSheetVisible] = useState(false);
  const [disputeErrorIndex, setDisputeErrorIndex] = useState<number | null>(null);

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

  const handleDisputeError = (index: number) => {
    setDisputeErrorIndex(index);
    setAppealSheetVisible(true);
  };

  const handleAppealSubmit = (data: {
    disagreementPoints: string[];
    reviewType: 'whole' | 'specific';
    comment: string;
    attachments: { uri: string; name: string; type: 'photo' | 'document' }[];
  }) => {
    const errorLabel =
      disputeErrorIndex !== null && homework.comparisonItems
        ? homework.comparisonItems[disputeErrorIndex].label
        : undefined;

    submitAppeal({
      homeworkId: homework.id,
      disagreementPoints: data.disagreementPoints,
      reviewType: 'specific',
      comment: data.comment,
      oldGrade: homework.grade ?? 0,
      errorIndex: disputeErrorIndex ?? undefined,
      errorLabel,
    });

    setAppealSheetVisible(false);
    setDisputeErrorIndex(null);
    Alert.alert(
      'Запрос отправлен',
      'Мы уведомим тебя, когда учитель примет решение',
    );
  };

  // Student submission photos
  const studentPhotos = homework.submissions.flatMap((sub) =>
    sub.files.filter((f) => f.type === 'photo').map((f) => f.uri)
  );

  return (
    <View
      style={[
        styles.safe,
        { backgroundColor: isGraded ? theme.colors.surface : theme.colors.background },
      ]}
    >
      <Stack.Screen
        options={{
          headerTransparent: isGraded,
          headerTitle: isGraded ? '' : 'Детали задания',
          headerStyle: isGraded
            ? { backgroundColor: 'transparent' }
            : { backgroundColor: theme.colors.surface },
          headerShadowVisible: !isGraded,
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={isGraded ? styles.contentGraded : styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Non-graded header */}
        {!isGraded && (
          <>
            <View style={styles.headerRow}>
              <StatusChip status={homework.status} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {homework.subject}
            </Text>
            <Text style={[styles.description, { color: theme.colors.text }]}>
              {homework.description}
            </Text>
          </>
        )}

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

        {/* ===== GRADED FLOW ===== */}
        {isGraded && (
          <View style={[styles.gradedContainer, { backgroundColor: theme.colors.card, paddingTop: insets.top + 48 }]}>
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

            {/* Comparison: student vs correct — with per-error dispute */}
            {homework.comparisonItems && homework.comparisonItems.length > 0 && (
              <ComparisonBlock
                items={homework.comparisonItems}
                onDisputeError={handleDisputeError}
                getErrorAppeal={(index: number) => getErrorAppeal(homework.id, index)}
              />
            )}

            {/* Твое фото */}
            {studentPhotos.length > 0 && (
              <View style={styles.yourPhotoSection}>
                <Text style={[styles.yourPhotoTitle, { color: theme.colors.text }]}>
                  Твое фото
                </Text>
                <View style={[styles.yourPhotoContainer, { backgroundColor: theme.colors.surface }]}>
                  <Pressable onPress={() => setPreviewImage(studentPhotos[0])}>
                    <Image
                      source={{ uri: studentPhotos[0] }}
                      style={styles.yourPhotoImage}
                    />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.expandPhotoBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => setPreviewImage(studentPhotos[0])}
                  >
                    <Text style={styles.expandPhotoBtnIcon}>⤢</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Homework-level appeal status (if exists) */}
            {appeal && (
              <View style={styles.actions}>
                <AppealStatusCard appeal={appeal} />
              </View>
            )}

            {/* Deep analysis */}
            {homework.aiFeedback && (
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

            {/* Appeal bottom sheet */}
            <AppealBottomSheet
              visible={appealSheetVisible}
              errorContext={
                disputeErrorIndex !== null && homework.comparisonItems
                  ? {
                      label: homework.comparisonItems[disputeErrorIndex].label,
                      studentAnswer: homework.comparisonItems[disputeErrorIndex].studentVersion.content,
                      correctAnswer: homework.comparisonItems[disputeErrorIndex].correctVersion.content,
                      description: homework.comparisonItems[disputeErrorIndex].description,
                    }
                  : undefined
              }
              onClose={() => {
                setAppealSheetVisible(false);
                setDisputeErrorIndex(null);
              }}
              onSubmit={handleAppealSubmit}
            />

            {/* Срок сдачи */}
            <Card style={styles.infoCard}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Срок сдачи
              </Text>
              <DeadlineIndicator
                deadline={homework.deadline}
                status={homework.status}
                submissions={homework.submissions}
              />
            </Card>
          </View>
        )}

        {/* ===== NON-GRADED FLOW ===== */}
        {!isGraded && (
          <>
            {/* Resubmit reason */}
            {homework.status === 'resubmit' && (
              <>
                {homework.grade !== undefined && (
                  <Card style={styles.gradeCard}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.text, marginTop: 0 },
                      ]}
                    >
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
              </>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {canSubmit ? (
                <View style={styles.actionBtnsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => router.push(`/homework/submit/${homework.id}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnIcon}>📸</Text>
                    <Text style={styles.actionBtnLabel}>Сдать</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]}
                    onPress={() =>
                      router.push(
                        `/chat/${AI_TUTOR_ID}?hwPromptSubject=${encodeURIComponent(homework.subject)}&hwPromptText=${encodeURIComponent(homework.description)}&hwStatus=${homework.status}`
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnIcon}>💬</Text>
                    <Text style={styles.actionBtnLabel}>Обсудить</Text>
                  </TouchableOpacity>
                </View>
              ) : homework.status === 'submitted' ? (
                <View style={styles.actionBtnsRow}>
                  <View
                    style={[
                      styles.actionBtn,
                      { backgroundColor: theme.colors.border, opacity: 0.6 },
                    ]}
                  >
                    <Text style={styles.actionBtnIcon}>✅</Text>
                    <Text style={styles.actionBtnLabel}>Сдано</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]}
                    onPress={() =>
                      router.push(
                        `/chat/${AI_TUTOR_ID}?hwPromptSubject=${encodeURIComponent(homework.subject)}&hwPromptText=${encodeURIComponent(homework.description)}&hwStatus=${homework.status}`
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnIcon}>💬</Text>
                    <Text style={styles.actionBtnLabel}>Обсудить</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Срок сдачи */}
            <Card style={styles.infoCard}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Срок сдачи
              </Text>
              <DeadlineIndicator
                deadline={homework.deadline}
                status={homework.status}
                submissions={homework.submissions}
              />
            </Card>

            {/* Submissions — photo thumbnails */}
            {studentPhotos.length > 0 && (
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
                  {studentPhotos.map((uri, index) => (
                    <Pressable key={index} onPress={() => setPreviewImage(uri)}>
                      <Image
                        source={{ uri }}
                        style={[styles.attachmentThumb, { borderColor: theme.colors.border }]}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

    </View>
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
  contentGraded: {
    // No horizontal padding — the white container handles it
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

  /* ── Graded flow ────────────────────────────────────────────── */
  gradedContainer: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
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

  /* Grade card — purple bar + sticker area */
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

  /* Feedback card — Резюме */
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

  /* Твое фото */
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

  /* ── Non-graded flow (resubmit grade card) ─────────────────── */
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

  /* ── Shared ─────────────────────────────────────────────────── */
  actions: {
    marginTop: 24,
    marginBottom: 16,
  },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnIcon: {
    fontSize: 22,
  },
  actionBtnLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
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
