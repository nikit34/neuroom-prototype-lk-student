import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';
import { formatDateTimeRu } from '@/src/utils/dateHelpers';
import Avatar from '@/src/components/ui/Avatar';

interface FeedbackBubbleProps {
  text: string;
  type: 'ai' | 'teacher';
  timestamp: Date;
}

export default function FeedbackBubble({ text, type, timestamp }: FeedbackBubbleProps) {
  const theme = useAppTheme();
  const age = useAgeStyles();
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
          borderRadius: age.cardBorderRadius,
          padding: age.cardPadding,
        },
      ]}
    >
      <View style={styles.header}>
        {isAI ? (
          <Text style={[styles.icon, { fontSize: age.isJunior ? 20 : 16 }]}>🤖</Text>
        ) : (
          <View style={styles.iconWrap}>
            <Avatar size={age.isJunior ? 24 : 20} neutral />
          </View>
        )}
        <Text style={[styles.label, { color: isAI ? theme.colors.primary : theme.colors.success, fontSize: age.smallSize }]}>
          {isAI ? 'Отзыв ИИ' : 'Отзыв учителя'}
        </Text>
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary, fontSize: age.isJunior ? 12 : 11 }]}>
          {formatDateTimeRu(timestamp)}
        </Text>
      </View>
      <Text style={[styles.text, { color: theme.colors.text, fontSize: age.isJunior ? 16 : 14, lineHeight: age.isJunior ? 23 : 20 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 3,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 6,
  },
  iconWrap: {
    marginRight: 6,
  },
  label: {
    fontWeight: '700',
    flex: 1,
  },
  timestamp: {},
  text: {},
});
