import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';
import { formatDateRu } from '@/src/utils/dateHelpers';
import { differenceInHours, isPast } from 'date-fns';
import { HomeworkStatus, Submission } from '@/src/types';

interface DeadlineIndicatorProps {
  deadline: Date;
  status: HomeworkStatus;
  submissions?: Submission[];
}

const ACTIVE_STATUSES: HomeworkStatus[] = ['pending', 'resubmit'];

function getActiveDotColor(deadline: Date, theme: ReturnType<typeof useAppTheme>): string {
  if (isPast(deadline)) return theme.colors.overdue;
  const hoursLeft = differenceInHours(deadline, new Date());
  if (hoursLeft < 24) return theme.colors.warning;
  return theme.colors.success;
}

function wasSubmittedOnTime(deadline: Date, submissions?: Submission[]): boolean {
  if (!submissions || submissions.length === 0) return false;
  const firstSubmission = submissions[0];
  return new Date(firstSubmission.submittedAt) <= new Date(deadline);
}

export default function DeadlineIndicator({ deadline, status, submissions }: DeadlineIndicatorProps) {
  const theme = useAppTheme();
  const age = useAgeStyles();
  const isActive = ACTIVE_STATUSES.includes(status);
  const dotSize = age.isJunior ? 10 : 8;

  if (isActive) {
    const color = getActiveDotColor(deadline, theme);
    return (
      <View style={styles.container}>
        <View style={[styles.dot, { backgroundColor: color, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
        <Text style={[styles.dateText, { color: theme.colors.textSecondary, fontSize: age.smallSize }]}>
          {isPast(deadline) ? 'Просрочено' : `до ${formatDateRu(deadline)}`}
        </Text>
      </View>
    );
  }

  const onTime = wasSubmittedOnTime(deadline, submissions);
  const markerColor = onTime ? theme.colors.success : theme.colors.overdue;
  const submittedDate = submissions?.[0]?.submittedAt
    ? formatDateRu(new Date(submissions[0].submittedAt))
    : formatDateRu(deadline);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: markerColor, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
      <Text style={[styles.statusLabel, { color: markerColor, fontSize: age.isJunior ? 14 : 12 }]}>
        {onTime ? `сдано ${submittedDate}` : 'Не в срок'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    marginRight: 8,
  },
  dateText: {
    fontWeight: '500',
  },
  statusLabel: {
    fontWeight: '600',
  },
});
