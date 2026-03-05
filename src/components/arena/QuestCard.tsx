import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import Card from '@/src/components/ui/Card';
import { Quest } from '@/src/types';

const STATUS_LABEL: Record<string, string> = {
  available: '📋 Доступен',
  active: '🔥 В процессе',
  completed: '✅ Завершён',
};

interface QuestCardProps {
  quest: Quest;
  onPress: () => void;
}

export default function QuestCard({ quest, onPress }: QuestCardProps) {
  const theme = useAppTheme();
  const completedSteps = quest.steps.filter((s) => s.isCompleted).length;
  const progress = quest.steps.length > 0 ? completedSteps / quest.steps.length : 0;
  const daysLeft = Math.max(0, Math.ceil((quest.deadline.getTime() - Date.now()) / 86400000));

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={[styles.subject, { color: theme.colors.textSecondary }]}>{quest.subject}</Text>
        <Text style={[styles.status, { color: quest.status === 'completed' ? theme.colors.success : theme.colors.accent }]}>
          {STATUS_LABEL[quest.status]}
        </Text>
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>{quest.title}</Text>
      <Text style={[styles.desc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {quest.description}
      </Text>

      <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
        <View
          style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${progress * 100}%` }]}
        />
      </View>
      <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
        {completedSteps} / {quest.steps.length} этапов
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.teamRow}>
          {quest.teamMembers.slice(0, 4).map((m) => (
            <Text key={m.id} style={styles.memberEmoji}>{m.avatarEmoji}</Text>
          ))}
          {quest.teamMembers.length > 4 && (
            <Text style={[styles.moreMembers, { color: theme.colors.textSecondary }]}>
              +{quest.teamMembers.length - 4}
            </Text>
          )}
        </View>
        <View style={styles.metaRow}>
          {quest.status !== 'completed' && (
            <Text style={[styles.deadline, { color: daysLeft <= 2 ? theme.colors.overdue : theme.colors.textSecondary }]}>
              {daysLeft} дн.
            </Text>
          )}
          <Text style={[styles.xp, { color: theme.colors.textSecondary }]}>+{quest.xpReward} опыта</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subject: { fontSize: 12, fontWeight: '500' },
  status: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 10, lineHeight: 18 },
  progressBar: { height: 6, borderRadius: 3, marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 12, marginBottom: 8 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  memberEmoji: { fontSize: 18 },
  moreMembers: { fontSize: 12, marginLeft: 4 },
  metaRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  deadline: { fontSize: 12, fontWeight: '600' },
  xp: { fontSize: 12 },
});
