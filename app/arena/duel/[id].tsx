import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useArenaStore } from '@/src/stores/arenaStore';
import QuestionCard from '@/src/components/arena/QuestionCard';
import DuelResultView from '@/src/components/arena/DuelResultView';
import Card from '@/src/components/ui/Card';

const TIME_LIMIT = 15;

export default function DuelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();

  const duel = useArenaStore((s) => s.duels.find((d) => d.id === id));
  const acceptDuel = useArenaStore((s) => s.acceptDuel);
  const declineDuel = useArenaStore((s) => s.declineDuel);
  const answerDuelQuestion = useArenaStore((s) => s.answerDuelQuestion);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showingResult, setShowingResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  const handleAnswer = useCallback((index: number) => {
    if (!duel || duel.status !== 'active') return;
    setSelectedAnswer(index);
    answerDuelQuestion(duel.id, index);
  }, [duel, answerDuelQuestion]);

  // Reset timer when question changes
  useEffect(() => {
    if (duel?.status === 'active') {
      setTimeLeft(TIME_LIMIT);
    }
  }, [duel?.currentQuestionIndex, duel?.status]);

  // Countdown
  useEffect(() => {
    if (!duel || duel.status !== 'active' || selectedAnswer !== null) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, duel?.status, selectedAnswer, handleAnswer]);

  useEffect(() => {
    if (selectedAnswer !== null) {
      const timer = setTimeout(() => {
        setSelectedAnswer(null);
        setShowingResult(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedAnswer]);

  if (!duel) {
    return (
      <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⏰</Text>
          <Text style={[styles.errorText, { color: theme.colors.text, fontWeight: '700', fontSize: 18, marginBottom: 8 }]}>
            Дуэль отменена
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Время ожидания истекло
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.colors.primary, borderRadius: 12 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>Назад</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Pending: accept/decline
  if (duel.status === 'pending') {
    return (
      <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.pendingContainer}>
          <Text style={styles.challengeEmoji}>⚔️</Text>
          <Text style={[styles.challengeTitle, { color: theme.colors.text }]}>Вызов на дуэль!</Text>
          <Card style={styles.challengeCard}>
            <Text style={styles.challengerEmoji}>{duel.challenger.avatarEmoji}</Text>
            <Text style={[styles.challengerName, { color: theme.colors.text }]}>{duel.challenger.name}</Text>
            <Text style={[styles.challengeSubject, { color: theme.colors.textSecondary }]}>
              Предмет: {duel.subject}
            </Text>
            <Text style={[styles.challengeQuestions, { color: theme.colors.textSecondary }]}>
              {duel.questions.length} вопросов · +{duel.xpReward} опыта
            </Text>
          </Card>
          {duel.isIncoming && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
                onPress={() => acceptDuel(duel.id)}
              >
                <Text style={styles.actionText}>Принять вызов</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.colors.overdue }]}
                onPress={() => { declineDuel(duel.id); router.back(); }}
              >
                <Text style={styles.actionText}>Отклонить</Text>
              </TouchableOpacity>
            </View>
          )}
          {!duel.isIncoming && (
            <Text style={[styles.waitingText, { color: theme.colors.textSecondary }]}>
              Ожидаем ответа оппонента...
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Finished: show result
  if (duel.status === 'finished') {
    return (
      <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <DuelResultView duel={duel} />
      </View>
    );
  }

  // Active: gameplay
  const currentQ = duel.questions[duel.currentQuestionIndex];
  if (!currentQ) {
    return (
      <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <DuelResultView duel={duel} />
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.gameContainer}>
        {/* Score header */}
        <View style={[styles.gameHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.gamePlayerCol}>
            <Text style={styles.gameAvatar}>{duel.challenger.avatarEmoji}</Text>
            <Text style={[styles.gameScore, { color: theme.colors.accent }]}>{duel.challenger.score}</Text>
          </View>
          <View style={styles.gameVs}>
            <Text style={[styles.gameVsText, { color: theme.colors.textSecondary }]}>VS</Text>
            <Text style={[styles.gameSubject, { color: theme.colors.textSecondary }]}>{duel.subject}</Text>
          </View>
          <View style={styles.gamePlayerCol}>
            <Text style={styles.gameAvatar}>{duel.opponent.avatarEmoji}</Text>
            <Text style={[styles.gameScore, { color: theme.colors.accent }]}>{duel.opponent.score}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${((duel.currentQuestionIndex) / duel.questions.length) * 100}%` }]}
          />
        </View>

        {/* Question */}
        <QuestionCard
          question={currentQ}
          questionNumber={duel.currentQuestionIndex + 1}
          totalQuestions={duel.questions.length}
          selectedAnswer={selectedAnswer}
          onAnswer={handleAnswer}
          timeLeft={timeLeft}
          timeLimit={TIME_LIMIT}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16 },
  pendingContainer: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  challengeEmoji: { fontSize: 72, marginBottom: 16 },
  challengeTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  challengeCard: { alignItems: 'center', marginBottom: 24, width: '100%' },
  challengerEmoji: { fontSize: 48, marginBottom: 8 },
  challengerName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  challengeSubject: { fontSize: 15, marginBottom: 4 },
  challengeQuestions: { fontSize: 14 },
  actions: { width: '100%', gap: 12 },
  actionBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  actionText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  waitingText: { fontSize: 16, marginTop: 20 },
  gameContainer: { flex: 1, padding: 20 },
  gameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  gamePlayerCol: { alignItems: 'center', width: 70 },
  gameAvatar: { fontSize: 28, marginBottom: 4 },
  gameScore: { fontSize: 24, fontWeight: '800' },
  gameVs: { alignItems: 'center' },
  gameVsText: { fontSize: 14, fontWeight: '700' },
  gameSubject: { fontSize: 11, marginTop: 2 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, borderRadius: 2 },
});
