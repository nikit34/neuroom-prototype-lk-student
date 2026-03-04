import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import Card from '@/src/components/ui/Card';
import { Duel } from '@/src/types';

const RESULT_EMOJI: Record<string, string> = {
  won: '🏆',
  lost: '😞',
  draw: '🤝',
};

const RESULT_TEXT: Record<string, string> = {
  won: 'Победа!',
  lost: 'Поражение',
  draw: 'Ничья!',
};

interface DuelResultViewProps {
  duel: Duel;
}

export default function DuelResultView({ duel }: DuelResultViewProps) {
  const theme = useAppTheme();

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.emoji}>{RESULT_EMOJI[duel.result || 'draw']}</Text>
      <Text style={[styles.resultText, { color: duel.result === 'won' ? theme.colors.success : duel.result === 'lost' ? theme.colors.overdue : theme.colors.accent }]}>
        {RESULT_TEXT[duel.result || 'draw']}
      </Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreCol}>
          <Text style={styles.scoreAvatar}>{duel.challenger.avatarEmoji}</Text>
          <Text style={[styles.scoreName, { color: theme.colors.text }]}>{duel.challenger.name}</Text>
          <Text style={[styles.scoreNum, { color: theme.colors.accent }]}>{duel.challenger.score}</Text>
        </View>
        <Text style={[styles.scoreDash, { color: theme.colors.textSecondary }]}>—</Text>
        <View style={styles.scoreCol}>
          <Text style={styles.scoreAvatar}>{duel.opponent.avatarEmoji}</Text>
          <Text style={[styles.scoreName, { color: theme.colors.text }]}>{duel.opponent.name}</Text>
          <Text style={[styles.scoreNum, { color: theme.colors.accent }]}>{duel.opponent.score}</Text>
        </View>
      </View>

      <Text style={[styles.xpReward, { color: theme.colors.success }]}>
        +{duel.result === 'won' ? duel.xpReward : duel.result === 'draw' ? Math.floor(duel.xpReward / 2) : Math.floor(duel.xpReward / 4)} XP
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Разбор вопросов</Text>
      {duel.questions.map((q, i) => {
        const myAnswer = duel.challenger.answers[i];
        const opAnswer = duel.opponent.answers[i];
        const myCorrect = myAnswer === q.correctIndex;
        const opCorrect = opAnswer === q.correctIndex;

        return (
          <Card key={q.id} style={styles.questionCard}>
            <Text style={[styles.qNum, { color: theme.colors.textSecondary }]}>Вопрос {i + 1}</Text>
            <Text style={[styles.qText, { color: theme.colors.text }]}>{q.text}</Text>
            <Text style={[styles.qAnswer, { color: theme.colors.success }]}>
              Ответ: {q.options[q.correctIndex]}
            </Text>
            <View style={styles.qResults}>
              <Text style={{ color: myCorrect ? '#4CAF50' : '#F44336', fontSize: 13 }}>
                Вы: {myAnswer !== null && myAnswer !== undefined ? q.options[myAnswer] : '—'} {myCorrect ? '✓' : '✗'}
              </Text>
              <Text style={{ color: opCorrect ? '#4CAF50' : '#F44336', fontSize: 13 }}>
                Оппонент: {opAnswer !== null && opAnswer !== undefined ? q.options[opAnswer] : '—'} {opCorrect ? '✓' : '✗'}
              </Text>
            </View>
          </Card>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: 8, marginTop: 16 },
  resultText: { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  scoreCol: { alignItems: 'center', width: 120 },
  scoreAvatar: { fontSize: 36, marginBottom: 4 },
  scoreName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  scoreNum: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  scoreDash: { fontSize: 24, marginHorizontal: 16 },
  xpReward: { fontSize: 20, fontWeight: '700', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', alignSelf: 'flex-start', marginBottom: 12 },
  questionCard: { marginBottom: 10, width: '100%' },
  qNum: { fontSize: 12, marginBottom: 4 },
  qText: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  qAnswer: { fontSize: 13, marginBottom: 6 },
  qResults: { gap: 2 },
});
