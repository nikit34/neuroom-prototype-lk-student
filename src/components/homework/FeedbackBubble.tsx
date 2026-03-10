import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { formatDateTimeRu } from '@/src/utils/dateHelpers';
import Avatar from '@/src/components/ui/Avatar';

interface FeedbackBubbleProps {
  text: string;
  type: 'ai' | 'teacher';
  timestamp: Date;
}

export default function FeedbackBubble({ text, type, timestamp }: FeedbackBubbleProps) {
  const theme = useAppTheme();
  const isAI = type === 'ai';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isAI
            ? theme.colors.primary + '20'
            : theme.colors.success + '20',
          borderLeftColor: isAI ? theme.colors.primary : theme.colors.success,
        },
      ]}
    >
      <View style={styles.header}>
        {isAI ? (
          <Text style={styles.icon}>🤖</Text>
        ) : (
          <View style={styles.iconWrap}>
            <Avatar size={20} neutral />
          </View>
        )}
        <Text style={[styles.label, { color: isAI ? theme.colors.primary : theme.colors.success }]}>
          {isAI ? 'Отзыв ИИ' : 'Отзыв учителя'}
        </Text>
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {formatDateTimeRu(timestamp)}
        </Text>
      </View>
      <Text style={[styles.text, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  iconWrap: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
