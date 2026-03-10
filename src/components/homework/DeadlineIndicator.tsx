import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
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
  const isActive = ACTIVE_STATUSES.includes(status);

  if (isActive) {
    const color = getActiveDotColor(deadline, theme);
    return (
      <View style={styles.container}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
          {isPast(deadline) ? 'Просрочено' : `до ${formatDateRu(deadline)}`}
        </Text>
      </View>
    );
  }

  // Completed/checked: only show green (on time) or red (late) marker
  const onTime = wasSubmittedOnTime(deadline, submissions);
  const markerColor = onTime ? theme.colors.success : theme.colors.overdue;
  const submittedDate = submissions?.[0]?.submittedAt
    ? formatDateRu(new Date(submissions[0].submittedAt))
    : formatDateRu(deadline);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: markerColor }]} />
      <Text style={[styles.statusLabel, { color: markerColor }]}>
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
