import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';
import Card from '@/src/components/ui/Card';
import { Duel } from '@/src/types';

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Ожидание',
  active: '⚔️ В бою',
  finished: '🏁 Завершена',
};

const TYPE_LABEL: Record<string, string> = {
  classmate: 'Одноклассник',
  cross_class: 'Межклассовая',
  team: 'Командная',
};

const RESULT_LABEL: Record<string, string> = {
  won: '🏆 Победа',
  lost: '😞 Поражение',
  draw: '🤝 Ничья',
};

interface DuelCardProps {
  duel: Duel;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function DuelCard({ duel, onPress, onAccept, onDecline }: DuelCardProps) {
  const theme = useAppTheme();
  const age = useAgeStyles();

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={[styles.typeLabel, { color: theme.colors.textSecondary, fontSize: age.isJunior ? 14 : 12 }]}>
          {TYPE_LABEL[duel.type]} · {duel.subject}
        </Text>
        <Text style={[styles.status, { color: duel.result === 'won' ? theme.colors.success : duel.result === 'lost' ? theme.colors.overdue : theme.colors.accent, fontSize: age.smallSize }]}>
          {duel.result ? RESULT_LABEL[duel.result] : STATUS_LABEL[duel.status]}
        </Text>
      </View>

      <View style={styles.vsRow}>
        <View style={styles.participant}>
          <Text style={[styles.avatar, { fontSize: age.isJunior ? 34 : 28 }]}>{duel.challenger.avatarEmoji}</Text>
          <Text style={[styles.name, { color: theme.colors.text, fontSize: age.smallSize }]} numberOfLines={1}>
            {duel.challenger.name}
          </Text>
          <Text style={[styles.score, { color: theme.colors.accent, fontSize: age.isJunior ? 24 : 20 }]}>{duel.challenger.score}</Text>
        </View>
        <Text style={[styles.vs, { color: theme.colors.textSecondary, fontSize: age.isJunior ? 20 : 16 }]}>VS</Text>
        <View style={styles.participant}>
          <Text style={[styles.avatar, { fontSize: age.isJunior ? 34 : 28 }]}>{duel.opponent.avatarEmoji}</Text>
          <Text style={[styles.name, { color: theme.colors.text, fontSize: age.smallSize }]} numberOfLines={1}>
            {duel.opponent.name}
          </Text>
          <Text style={[styles.score, { color: theme.colors.accent, fontSize: age.isJunior ? 24 : 20 }]}>{duel.opponent.score}</Text>
        </View>
      </View>

      {duel.status === 'active' && (
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary, width: `${(duel.currentQuestionIndex / duel.questions.length) * 100}%` },
            ]}
          />
        </View>
      )}

      {duel.status === 'pending' && duel.isIncoming && onAccept && onDecline && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.success, paddingVertical: age.isJunior ? 13 : 10, borderRadius: age.cardBorderRadius }]}
            onPress={onAccept}
          >
            <Text style={[styles.actionText, { fontSize: age.isJunior ? 16 : 14 }]}>Принять</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.overdue, paddingVertical: age.isJunior ? 13 : 10, borderRadius: age.cardBorderRadius }]}
            onPress={onDecline}
          >
            <Text style={[styles.actionText, { fontSize: age.isJunior ? 16 : 14 }]}>Отклонить</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.xp, { color: theme.colors.textSecondary, fontSize: age.isJunior ? 14 : 12 }]}>+{duel.xpReward} опыта</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeLabel: { fontSize: 12, fontWeight: '500' },
  status: { fontSize: 13, fontWeight: '600' },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  participant: { flex: 1, alignItems: 'center' },
  avatar: { fontSize: 28, marginBottom: 4 },
  name: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  score: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  vs: { fontSize: 16, fontWeight: '700', marginHorizontal: 12 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 4 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  xp: { fontSize: 12, textAlign: 'right', marginTop: 4 },
});
