import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { HomeworkAssignment } from '@/src/types';
import { isOverdue } from '@/src/utils/dateHelpers';
import { getGradeColor, getGradeEmoji } from '@/src/utils/gradeHelpers';
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
  const overdue = isOverdue(homework.deadline) && homework.status === 'pending';

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
    <Animated.View style={[styles.animatedWrapper, animatedBorderStyle, { borderRadius: 16 }]}>
      <Card style={styles.card} onPress={onPress}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {homework.subject}
            </Text>
            <Text style={[styles.subject, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {homework.description.split('\n')[0]}
            </Text>
          </View>
          <StatusChip status={homework.status} />
        </View>

        <View style={styles.footer}>
          <DeadlineIndicator deadline={homework.deadline} />
          <View style={styles.footerRight}>
            {homework.classmateSubmittedCount != null && homework.totalClassmates != null && (
              <Text style={[styles.classmateCount, { color: theme.colors.textSecondary }]}>
                👥 {homework.classmateSubmittedCount} из {homework.totalClassmates}
              </Text>
            )}
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
  classmateCount: {
    fontSize: 12,
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
});
