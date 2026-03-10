import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useArenaStore } from '@/src/stores/arenaStore';
import Card from '@/src/components/ui/Card';

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();

  const quest = useArenaStore((s) => s.quests.find((q) => q.id === id));
  const joinQuest = useArenaStore((s) => s.joinQuest);
  const completeQuestStep = useArenaStore((s) => s.completeQuestStep);

  if (!quest) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Квест не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedSteps = quest.steps.filter((s) => s.isCompleted).length;
  const progress = quest.steps.length > 0 ? completedSteps / quest.steps.length : 0;
  const daysLeft = Math.max(0, Math.ceil((quest.deadline.getTime() - Date.now()) / 86400000));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subject, { color: theme.colors.accent }]}>{quest.subject}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{quest.title}</Text>
        <Text style={[styles.desc, { color: theme.colors.textSecondary }]}>{quest.description}</Text>

        <View style={styles.metaRow}>
          {quest.status !== 'completed' && (
            <View style={[styles.metaBadge, { backgroundColor: daysLeft <= 2 ? theme.colors.overdue + '22' : theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.metaText, { color: daysLeft <= 2 ? theme.colors.overdue : theme.colors.textSecondary }]}>
                {daysLeft} дн. до срока сдачи
              </Text>
            </View>
          )}
          <View style={[styles.metaBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.metaText, { color: theme.colors.accent }]}>+{quest.xpReward} опыта</Text>
          </View>
        </View>

        {/* Progress */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Прогресс</Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {completedSteps} из {quest.steps.length} этапов
        </Text>

        {/* Steps */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Этапы</Text>
        {quest.steps.map((step, i) => {
          const firstIncomplete = quest.steps.findIndex((s) => !s.isCompleted);
          const canComplete = quest.status === 'active' && !step.isCompleted && i === firstIncomplete;

          return (
            <Card key={step.id} style={styles.stepCard}>
              <View style={styles.stepRow}>
                <Text style={styles.stepIcon}>{step.isCompleted ? '✅' : '🔲'}</Text>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{step.title}</Text>
                  <Text style={[styles.stepDesc, { color: theme.colors.textSecondary }]}>{step.description}</Text>
                </View>
              </View>
              {canComplete && (
                <TouchableOpacity
                  style={[styles.completeBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => completeQuestStep(quest.id, step.id)}
                >
                  <Text style={styles.completeBtnText}>Выполнить</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}

        {/* Team */}
        {quest.teamMembers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Команда</Text>
            <Card>
              {quest.teamMembers.map((m) => (
                <View key={m.id} style={styles.memberRow}>
                  <Text style={styles.memberEmoji}>{m.avatarEmoji}</Text>
                  <Text style={[styles.memberName, { color: theme.colors.text }]}>{m.name}</Text>
                  <Text style={[styles.memberContribution, { color: theme.colors.accent }]}>{m.contribution}%</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Join button */}
        {quest.status === 'available' && (
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => joinQuest(quest.id)}
          >
            <Text style={styles.joinBtnText}>Присоединиться к квесту</Text>
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
  subject: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  desc: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metaBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  metaText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  progressBar: { height: 8, borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { fontSize: 13, marginBottom: 16 },
  stepCard: { marginBottom: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIcon: { fontSize: 20, marginTop: 2 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  stepDesc: { fontSize: 13, lineHeight: 18 },
  completeBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  completeBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  memberEmoji: { fontSize: 24 },
  memberName: { flex: 1, fontSize: 15, fontWeight: '600' },
  memberContribution: { fontSize: 14, fontWeight: '700' },
  joinBtn: { marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  joinBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
