import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import {
  subscribeToRoom,
  submitAnswer,
  finishRoom,
  getQuestionsForRoom,
  isAnswered,
  type OnlineRoom,
} from '@/src/services/onlineDuel';
import QuestionCard from '@/src/components/arena/QuestionCard';

export default function OnlineDuelGameScreen() {
  const { code, role } = useLocalSearchParams<{ code: string; role: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const student = useStudentStore((s) => s.student);

  const [room, setRoom] = useState<OnlineRoom | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const playerKey = role === 'player1' ? 'player1' : 'player2';

  useEffect(() => {
    if (!code) return;
    const unsub = subscribeToRoom(code, setRoom);
    return unsub;
  }, [code]);

  const me = room?.[playerKey];
  const opponent = room?.[playerKey === 'player1' ? 'player2' : 'player1'];
  const questions = room ? getQuestionsForRoom(room.questionIds) : [];

  // Safely get answers as array
  const myAnswers: number[] = me?.answers
    ? (Array.isArray(me.answers) ? me.answers : Object.values(me.answers))
    : [];
  const opponentAnswers: number[] = opponent?.answers
    ? (Array.isArray(opponent.answers) ? opponent.answers : Object.values(opponent.answers))
    : [];

  // Find current question index for this player (first unanswered)
  const myQuestionIndex = myAnswers.findIndex((a) => !isAnswered(a));
  const myFinished = myAnswers.length > 0 && myAnswers.every((a) => isAnswered(a));
  const opponentFinished = opponentAnswers.length > 0 && opponentAnswers.every((a) => isAnswered(a));

  const currentQ = !myFinished && myQuestionIndex >= 0 ? questions[myQuestionIndex] : null;

  // Check if both finished
  useEffect(() => {
    if (myFinished && opponentFinished && room?.status === 'active') {
      finishRoom(code!);
    }
  }, [myFinished, opponentFinished, room?.status, code]);

  const handleAnswer = useCallback((index: number) => {
    if (!currentQ || !me || !code || selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const isCorrect = index === currentQ.correctIndex;
    const qi = myQuestionIndex;
    const score = me.score;

    setTimeout(() => {
      setSelectedAnswer(null);
      submitAnswer(code, playerKey as 'player1' | 'player2', qi, index, isCorrect, score);
    }, 1200);
  }, [currentQ, me, code, playerKey, myQuestionIndex, selectedAnswer]);

  // Waiting for opponent to join
  if (room?.status === 'waiting') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={styles.waitEmoji}>⏳</Text>
          <Text style={[styles.waitTitle, { color: theme.colors.text }]}>Ожидаем соперника...</Text>
          <View style={[styles.codeBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
            <Text style={[styles.codeText, { color: theme.colors.primary }]}>{code}</Text>
          </View>
          <Text style={[styles.waitHint, { color: theme.colors.textSecondary }]}>
            Передайте этот код другу
          </Text>
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Room not found / loading
  if (!room || !me || !opponent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Finished -- show results
  if (room.status === 'finished' || (myFinished && opponentFinished)) {
    const myScore = me.score;
    const oppScore = opponent.score;
    const result = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw';
    const resultEmoji = result === 'win' ? '🏆' : result === 'lose' ? '😔' : '🤝';
    const resultText = result === 'win' ? 'Победа!' : result === 'lose' ? 'Поражение' : 'Ничья!';
    const resultColor = result === 'win' ? theme.colors.success : result === 'lose' ? theme.colors.overdue : theme.colors.warning;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={styles.resultEmoji}>{resultEmoji}</Text>
          <Text style={[styles.resultTitle, { color: resultColor }]}>{resultText}</Text>
          <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.scoreRow}>
              <View style={styles.scorePlayer}>
                <Text style={styles.scoreAvatar}>{me.avatarEmoji}</Text>
                <Text style={[styles.scoreName, { color: theme.colors.text }]}>{me.name}</Text>
              </View>
              <Text style={[styles.scoreValue, { color: theme.colors.primary }]}>{myScore}</Text>
              <Text style={[styles.scoreVs, { color: theme.colors.textSecondary }]}>:</Text>
              <Text style={[styles.scoreValue, { color: theme.colors.accent }]}>{oppScore}</Text>
              <View style={styles.scorePlayer}>
                <Text style={styles.scoreAvatar}>{opponent.avatarEmoji}</Text>
                <Text style={[styles.scoreName, { color: theme.colors.text }]}>{opponent.name}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.subjectHint, { color: theme.colors.textSecondary }]}>{room.subject}</Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.replace('/(tabs)/arena')}
          >
            <Text style={styles.backBtnText}>Вернуться в арену</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // I finished, waiting for opponent
  if (myFinished) {
    const answeredByOpponent = opponentAnswers.filter((a) => isAnswered(a)).length;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={styles.waitEmoji}>⏳</Text>
          <Text style={[styles.waitTitle, { color: theme.colors.text }]}>Вы ответили на все вопросы!</Text>
          <Text style={[styles.waitHint, { color: theme.colors.textSecondary }]}>
            Ожидаем соперника... ({answeredByOpponent}/{questions.length})
          </Text>
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Active gameplay
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.gameContainer}>
        {/* Score header */}
        <View style={[styles.gameHeader, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.gamePlayerCol}>
            <Text style={styles.gameAvatar}>{me.avatarEmoji}</Text>
            <Text style={[styles.gamePlayerName, { color: theme.colors.text }]} numberOfLines={1}>{me.name.split(' ')[0]}</Text>
            <Text style={[styles.gameScore, { color: theme.colors.primary }]}>{me.score}</Text>
          </View>
          <View style={styles.gameVs}>
            <Text style={[styles.gameVsText, { color: theme.colors.textSecondary }]}>VS</Text>
            <Text style={[styles.gameSubject, { color: theme.colors.textSecondary }]}>{room.subject}</Text>
          </View>
          <View style={styles.gamePlayerCol}>
            <Text style={styles.gameAvatar}>{opponent.avatarEmoji}</Text>
            <Text style={[styles.gamePlayerName, { color: theme.colors.text }]} numberOfLines={1}>{opponent.name.split(' ')[0]}</Text>
            <Text style={[styles.gameScore, { color: theme.colors.accent }]}>{opponent.score}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${(myQuestionIndex / questions.length) * 100}%` }]}
          />
        </View>

        {/* Question */}
        {currentQ && (
          <QuestionCard
            question={currentQ}
            questionNumber={myQuestionIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={selectedAnswer}
            onAnswer={handleAnswer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  waitEmoji: { fontSize: 64, marginBottom: 16 },
  waitTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  codeBox: { borderWidth: 3, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 12 },
  codeText: { fontSize: 40, fontWeight: '900', letterSpacing: 12 },
  waitHint: { fontSize: 15, textAlign: 'center' },
  loadingText: { fontSize: 16, marginTop: 12 },
  resultEmoji: { fontSize: 72, marginBottom: 12 },
  resultTitle: { fontSize: 32, fontWeight: '900', marginBottom: 20 },
  scoreCard: { borderWidth: 1, borderRadius: 20, padding: 20, width: '100%', marginBottom: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  scorePlayer: { alignItems: 'center', width: 80 },
  scoreAvatar: { fontSize: 32, marginBottom: 4 },
  scoreName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  scoreValue: { fontSize: 36, fontWeight: '900' },
  scoreVs: { fontSize: 24, fontWeight: '700' },
  subjectHint: { fontSize: 15, marginBottom: 24 },
  backBtn: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16 },
  backBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  gameContainer: { flex: 1, padding: 20 },
  gameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  gamePlayerCol: { alignItems: 'center', width: 80 },
  gameAvatar: { fontSize: 28, marginBottom: 2 },
  gamePlayerName: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  gameScore: { fontSize: 24, fontWeight: '800' },
  gameVs: { alignItems: 'center' },
  gameVsText: { fontSize: 14, fontWeight: '700' },
  gameSubject: { fontSize: 11, marginTop: 2 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, borderRadius: 2 },
});
