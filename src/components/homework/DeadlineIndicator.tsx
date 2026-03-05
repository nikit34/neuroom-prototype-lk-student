import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { isOverdue, getTimeRemaining, formatDateRu } from '@/src/utils/dateHelpers';
import { differenceInHours, isPast } from 'date-fns';

interface DeadlineIndicatorProps {
  deadline: Date;
}

function getDeadlineColor(deadline: Date, theme: ReturnType<typeof useAppTheme>): string {
  if (isPast(deadline)) return theme.colors.overdue;
  const hoursLeft = differenceInHours(deadline, new Date());
  if (hoursLeft < 24) return theme.colors.warning;
  return theme.colors.success;
}

export default function DeadlineIndicator({ deadline }: DeadlineIndicatorProps) {
  const theme = useAppTheme();
  const color = getDeadlineColor(deadline, theme);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.remaining, { color }]}>
          {getTimeRemaining(deadline)}
        </Text>
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
          {formatDateRu(deadline)}
        </Text>
      </View>
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
  remaining: {
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    marginTop: 1,
  },
});
