import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { HomeworkStatus } from '@/src/types';

interface StatusChipProps {
  status: HomeworkStatus;
}

const STATUS_CONFIG: Record<HomeworkStatus, { label: string; color: string }> = {
  pending: { label: 'Ожидает сдачи', color: '#F59E0B' },
  submitted: { label: 'Отправлено', color: '#3B82F6' },
  ai_reviewed: { label: 'Проверено Нейрумом', color: '#8B5CF6' },
  graded: { label: 'Проверено учителем', color: '#10B981' },
  resubmit: { label: 'На доработку', color: '#EF4444' },
  disputed: { label: 'Оспорено', color: '#F97316' },
};

export default function StatusChip({ status }: StatusChipProps) {
  const theme = useAppTheme();
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.container, { backgroundColor: config.color + '20' }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
