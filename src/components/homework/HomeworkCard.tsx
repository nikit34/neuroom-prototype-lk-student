import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { HomeworkAssignment } from '@/src/types';
import { isOverdue } from '@/src/utils/dateHelpers';
import { getGradeColor, getGradeEmoji } from '@/src/utils/gradeHelpers';
import { AI_TUTOR_ID } from '@/src/stores/chatStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import Card from '@/src/components/ui/Card';
import StatusChip from '@/src/components/ui/StatusChip';
import DeadlineIndicator from './DeadlineIndicator';

interface HomeworkCardProps {
  homework: HomeworkAssignment;
  onPress: () => void;
}

const SUBJECT_EMOJI: Record<string, string> = {
  Математика: '📐',
  Русский: '📝',
  Литература: '📚',
  Физика: '⚛️',
  Химия: '🧪',
  Биология: '🧬',
  История: '🏛️',
  География: '🌍',
  Английский: '🇬🇧',
  Информатика: '💻',
};

function getSubjectEmoji(subject: string): string {
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJI)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '📖';
}

export default function HomeworkCard({ homework, onPress }: HomeworkCardProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const viewedCheckedIds = useHomeworkStore((s) => s.viewedCheckedIds);
  const canSubmit = homework.status === 'pending' || homework.status === 'resubmit';
  const overdue = isOverdue(homework.deadline) && homework.status === 'pending';
  const isChecked = homework.status === 'graded' || homework.status === 'ai_reviewed';
  const isDimmed = isChecked && viewedCheckedIds.includes(homework.id);

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (overdue) {
      pulseValue.value = withRepeat(
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulseValue.value = 1;
    }
  }, [overdue]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: overdue ? `rgba(239, 68, 68, ${pulseValue.value})` : theme.colors.border,
    borderWidth: overdue ? 2 : 1,
  }));

  return (
    <Animated.View style={[styles.animatedWrapper, animatedBorderStyle, { borderRadius: 16 }, isDimmed && { opacity: 0.55 }]}>
      <Card style={styles.card} onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: isDimmed ? theme.colors.textSecondary : theme.colors.text }]} numberOfLines={1}>
              {homework.subject}
            </Text>
            <Text style={[styles.subject, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {homework.description.split('\n')[0]}
            </Text>
          </View>
          <StatusChip status={homework.status} />
        </View>

        <View style={styles.footer}>
          <DeadlineIndicator deadline={homework.deadline} status={homework.status} submissions={homework.submissions} />
          <View style={styles.footerRight}>
{homework.grade !== undefined && (
              <View style={styles.gradeContainer}>
                <Text style={styles.gradeEmoji}>
                  {getGradeEmoji(homework.grade, homework.maxGrade)}
                </Text>
                <Text
                  style={[
                    styles.gradeText,
                    { color: getGradeColor(homework.grade, homework.maxGrade) },
                  ]}
                >
                  {homework.grade}/{homework.maxGrade}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionBtnsRow}>
          {canSubmit ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push(`/homework/submit/${homework.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnIcon}>📸</Text>
              <Text style={styles.actionBtnLabel}>Сдать</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn, { backgroundColor: theme.colors.border, opacity: 0.5 }]}>
              <Text style={styles.actionBtnIcon}>✅</Text>
              <Text style={styles.actionBtnLabel}>Сдано</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.accent }]}
            onPress={() => router.push(`/chat/${AI_TUTOR_ID}?hwPromptSubject=${encodeURIComponent(homework.subject)}&hwPromptText=${encodeURIComponent(homework.description)}&hwStatus=${homework.status}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnIcon}>💬</Text>
            <Text style={styles.actionBtnLabel}>Обсудить</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedWrapper: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  card: {
    borderWidth: 0,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subject: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnIcon: {
    fontSize: 14,
  },
  actionBtnLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
