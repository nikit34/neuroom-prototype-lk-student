import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import Card from '@/src/components/ui/Card';
import { Challenge } from '@/src/types';

const DIFFICULTY_LABEL: Record<string, { label: string; color: string }> = {
  easy: { label: '🟢 Легко', color: '#4CAF50' },
  medium: { label: '🟡 Средне', color: '#FF9800' },
  hard: { label: '🔴 Сложно', color: '#F44336' },
};

const STATUS_LABEL: Record<string, string> = {
  available: '📋 Доступно',
  active: '🔥 Активно',
  completed: '✅ Завершено',
  expired: '⏰ Истекло',
};

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: () => void;
  onStart?: () => void;
}

export default function ChallengeCard({ challenge, onPress, onStart }: ChallengeCardProps) {
  const theme = useAppTheme();
  const progress = challenge.target > 0 ? challenge.progress / challenge.target : 0;
  const daysLeft = Math.max(0, Math.ceil((challenge.deadline.getTime() - Date.now()) / 86400000));
  const diff = DIFFICULTY_LABEL[challenge.difficulty];

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={[styles.diff, { color: diff.color }]}>{diff.label}</Text>
        <Text style={[styles.status, { color: challenge.status === 'completed' ? theme.colors.success : challenge.status === 'expired' ? theme.colors.overdue : theme.colors.accent }]}>
          {STATUS_LABEL[challenge.status]}
        </Text>
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>{challenge.title}</Text>
      <Text style={[styles.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {challenge.description}
      </Text>

      <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
        <View
          style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${progress * 100}%` }]}
        />
      </View>
      <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
        {challenge.progress} / {challenge.target}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.rewardRow}>
          <Text style={[styles.xp, { color: theme.colors.accent }]}>+{challenge.reward.xp} опыта</Text>
          {challenge.reward.badge && (
            <Text style={styles.badge}>{challenge.reward.badge.icon}</Text>
          )}
        </View>
        <View style={styles.metaRow}>
          {challenge.status !== 'completed' && challenge.status !== 'expired' && (
            <Text style={[styles.deadline, { color: daysLeft <= 2 ? theme.colors.overdue : theme.colors.textSecondary }]}>
              {daysLeft} дн.
            </Text>
          )}
        </View>
      </View>

      {challenge.status === 'available' && onStart && (
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: theme.colors.primary }]}
          onPress={onStart}
        >
          <Text style={styles.startText}>Начать</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  diff: { fontSize: 12, fontWeight: '600' },
  status: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 10, lineHeight: 18 },
  progressBar: { height: 6, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, marginBottom: 8 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xp: { fontSize: 13, fontWeight: '700' },
  badge: { fontSize: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  deadline: { fontSize: 12, fontWeight: '600' },
  startBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  startText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
