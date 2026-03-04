import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useArenaStore } from '@/src/stores/arenaStore';
import Card from '@/src/components/ui/Card';

const DIFFICULTY_LABEL: Record<string, { label: string; color: string }> = {
  easy: { label: '🟢 Легко', color: '#4CAF50' },
  medium: { label: '🟡 Средне', color: '#FF9800' },
  hard: { label: '🔴 Сложно', color: '#F44336' },
};

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();

  const challenge = useArenaStore((s) => s.challenges.find((c) => c.id === id));
  const startChallenge = useArenaStore((s) => s.startChallenge);
  const updateChallengeProgress = useArenaStore((s) => s.updateChallengeProgress);

  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!challenge || challenge.status === 'completed' || challenge.status === 'expired') return;

    const update = () => {
      const diff = challenge.deadline.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Время вышло');
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${days}д ${hours}ч ${mins}м`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [challenge]);

  if (!challenge) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Испытание не найдено</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = challenge.target > 0 ? challenge.progress / challenge.target : 0;
  const diff = DIFFICULTY_LABEL[challenge.difficulty];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={[styles.diffLabel, { color: diff.color }]}>{diff.label}</Text>
          <Text style={[styles.subjectLabel, { color: theme.colors.textSecondary }]}>{challenge.subject}</Text>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>{challenge.title}</Text>
        <Text style={[styles.desc, { color: theme.colors.textSecondary }]}>{challenge.description}</Text>

        {/* Timer */}
        {challenge.status !== 'completed' && challenge.status !== 'expired' && (
          <Card style={styles.timerCard}>
            <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>Осталось времени</Text>
            <Text style={[styles.timerValue, { color: theme.colors.accent }]}>{countdown}</Text>
          </Card>
        )}

        {/* Progress */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Прогресс</Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {challenge.progress} / {challenge.target} ({Math.round(progress * 100)}%)
        </Text>

        {/* Reward */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Награда</Text>
        <Card style={styles.rewardCard}>
          <Text style={[styles.rewardXp, { color: theme.colors.accent }]}>+{challenge.reward.xp} XP</Text>
          {challenge.reward.badge && (
            <View style={styles.badgeRow}>
              <Text style={styles.badgeIcon}>{challenge.reward.badge.icon}</Text>
              <Text style={[styles.badgeTitle, { color: theme.colors.text }]}>{challenge.reward.badge.title}</Text>
            </View>
          )}
        </Card>

        {/* Status message */}
        {challenge.status === 'completed' && (
          <Card style={{ ...styles.statusCard, backgroundColor: '#E8F5E9' }}>
            <Text style={styles.statusEmoji}>🎉</Text>
            <Text style={styles.statusText}>Испытание завершено! Награда получена.</Text>
          </Card>
        )}

        {challenge.status === 'expired' && (
          <Card style={{ ...styles.statusCard, backgroundColor: '#FFEBEE' }}>
            <Text style={styles.statusEmoji}>⏰</Text>
            <Text style={styles.statusText}>Время вышло. Попробуйте в следующий раз!</Text>
          </Card>
        )}

        {/* Actions */}
        {challenge.status === 'available' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => startChallenge(challenge.id)}
          >
            <Text style={styles.actionBtnText}>Начать испытание</Text>
          </TouchableOpacity>
        )}

        {challenge.status === 'active' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
            onPress={() => updateChallengeProgress(challenge.id, 1)}
          >
            <Text style={styles.actionBtnText}>+1 прогресс</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16 },
  content: { padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  diffLabel: { fontSize: 14, fontWeight: '700' },
  subjectLabel: { fontSize: 14, fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  timerCard: { alignItems: 'center', marginBottom: 20 },
  timerLabel: { fontSize: 13, marginBottom: 4 },
  timerValue: { fontSize: 28, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  progressBar: { height: 10, borderRadius: 5, marginBottom: 6 },
  progressFill: { height: 10, borderRadius: 5 },
  progressText: { fontSize: 14, marginBottom: 20 },
  rewardCard: { alignItems: 'center', marginBottom: 20 },
  rewardXp: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeIcon: { fontSize: 32 },
  badgeTitle: { fontSize: 16, fontWeight: '700' },
  statusCard: { alignItems: 'center', padding: 20, marginBottom: 20 },
  statusEmoji: { fontSize: 48, marginBottom: 8 },
  statusText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  actionBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
