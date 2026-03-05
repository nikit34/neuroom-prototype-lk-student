import React, { useRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useArenaStore } from '@/src/stores/arenaStore';
import { useStudentStore } from '@/src/stores/studentStore';
import { mockClassmates } from '@/src/data/mockData';
import DuelCard from '@/src/components/arena/DuelCard';
import QuestCard from '@/src/components/arena/QuestCard';
import ChallengeCard from '@/src/components/arena/ChallengeCard';
import LeaderboardRow from '@/src/components/achievements/LeaderboardRow';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

type Section = 'duels' | 'leaderboard' | 'quests' | 'challenges';

const ALL_SECTIONS: { key: Section; label: string }[] = [
  { key: 'duels', label: 'Дуэли ⚔️' },
  { key: 'leaderboard', label: 'Рейтинг 🏆' },
  { key: 'quests', label: 'Квесты 🗺️' },
  { key: 'challenges', label: 'Испытания 🎯' },
];

const DUEL_FILTERS = [
  { key: 'all' as const, label: 'Все' },
  { key: 'pending' as const, label: 'Ожидание' },
  { key: 'active' as const, label: 'Активные' },
  { key: 'finished' as const, label: 'Завершённые' },
];

const QUEST_FILTERS = [
  { key: 'all' as const, label: 'Все' },
  { key: 'active' as const, label: 'Активные' },
  { key: 'available' as const, label: 'Доступные' },
  { key: 'completed' as const, label: 'Завершённые' },
];

const CHALLENGE_FILTERS = [
  { key: 'all' as const, label: 'Все' },
  { key: 'active' as const, label: 'Активные' },
  { key: 'available' as const, label: 'Доступные' },
  { key: 'completed' as const, label: 'Завершённые' },
];

export default function ArenaScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  const section = useArenaStore((s) => s.section);
  const setSection = useArenaStore((s) => s.setSection);
  const questsEnabled = useArenaStore((s) => s.questsEnabled);
  const challengesEnabled = useArenaStore((s) => s.challengesEnabled);

  const student = useStudentStore((s) => s.student);

  const sections = ALL_SECTIONS.filter((s) => {
    if (s.key === 'quests') return questsEnabled;
    if (s.key === 'challenges') return challengesEnabled;
    return true;
  });

  const activeSection = sections.some((s) => s.key === section) ? section : 'duels';

  const duelFilter = useArenaStore((s) => s.duelFilter);
  const setDuelFilter = useArenaStore((s) => s.setDuelFilter);
  const getFilteredDuels = useArenaStore((s) => s.getFilteredDuels);
  const acceptDuel = useArenaStore((s) => s.acceptDuel);
  const declineDuel = useArenaStore((s) => s.declineDuel);


  const questFilter = useArenaStore((s) => s.questFilter);
  const setQuestFilter = useArenaStore((s) => s.setQuestFilter);
  const getFilteredQuests = useArenaStore((s) => s.getFilteredQuests);

  const challengeFilter = useArenaStore((s) => s.challengeFilter);
  const setChallengeFilter = useArenaStore((s) => s.setChallengeFilter);
  const getFilteredChallenges = useArenaStore((s) => s.getFilteredChallenges);
  const startChallenge = useArenaStore((s) => s.startChallenge);

  const duels = useArenaStore((s) => s.duels);
  const quests = useArenaStore((s) => s.quests);
  const challenges = useArenaStore((s) => s.challenges);

  const sectionCounts: Record<Section, number> = {
    duels: duels.filter((d) => d.status === 'pending' || d.status === 'active').length,
    leaderboard: 0,
    quests: quests.filter((q) => q.status === 'active').length,
    challenges: challenges.filter((c) => c.status === 'active').length,
  };

  const leaderboard = useMemo(() => {
    const all = [
      ...mockClassmates.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        totalPoints: c.totalPoints,
        avatarEmoji: c.avatarEmoji,
        isCurrentUser: false,
      })),
      {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        totalPoints: student.totalPoints,
        avatarEmoji: '🐺',
        isCurrentUser: true,
      },
    ];
    return all.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [student.totalPoints, student.firstName, student.lastName, student.id]);

  const currentUserIndex = leaderboard.findIndex((e) => e.isCurrentUser);
  const leaderboardRef = useRef<FlatList>(null);
  const [tipVisible, setTipVisible] = useState(false);

  const scrollToStudent = useCallback(() => {
    if (currentUserIndex >= 0 && leaderboardRef.current) {
      leaderboardRef.current.scrollToIndex({
        index: currentUserIndex,
        viewPosition: 0.5,
        animated: false,
      });
    }
  }, [currentUserIndex]);

  const tip = useMemo(() => {
    if (currentUserIndex <= 0) return 'Вы на первом месте! Продолжайте в том же духе!';
    const above = leaderboard[currentUserIndex - 1];
    const gap = above.totalPoints - student.totalPoints;
    const hints = [
      `До ${above.name.split(' ')[0]} — всего ${gap} очков. Сдайте ДЗ пораньше для бонуса!`,
      `Не хватает ${gap} очков до ${currentUserIndex}-го места. Выиграйте дуэль — это +50!`,
      `${gap} очков отделяют вас от ${above.name.split(' ')[0]}. Серия ДЗ вовремя даст множитель!`,
    ];
    return hints[currentUserIndex % hints.length];
  }, [currentUserIndex, leaderboard, student.totalPoints]);

  const renderFilters = () => {
    if (activeSection === 'leaderboard') return null;
    const filters = activeSection === 'duels' ? DUEL_FILTERS : activeSection === 'quests' ? QUEST_FILTERS : CHALLENGE_FILTERS;
    const current = activeSection === 'duels' ? duelFilter : activeSection === 'quests' ? questFilter : challengeFilter;
    const setFn = activeSection === 'duels' ? setDuelFilter : activeSection === 'quests' ? setQuestFilter : setChallengeFilter;

    return (
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const active = current === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setFn(f.key as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, { color: active ? '#FFF' : theme.colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    if (activeSection === 'duels') {
      const duels = getFilteredDuels();
      return (
        <FlatList
          data={duels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DuelCard
              duel={item}
              onPress={() => router.push(`/arena/duel/${item.id}`)}
              onAccept={() => acceptDuel(item.id)}
              onDecline={() => declineDuel(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity
              style={[styles.createDuelBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push('/arena/create-duel')}
              activeOpacity={0.7}
            >
              <Text style={styles.createDuelBtnText}>+ Вызвать на дуэль</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={<EmptyState text="Нет дуэлей" emoji="⚔️" color={theme.colors.textSecondary} />}
        />
      );
    }

    if (activeSection === 'leaderboard') {
      const ROW_HEIGHT = 60 + 8;
      return (
        <FlatList
          ref={leaderboardRef}
          data={leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <>
              <LeaderboardRow
                rank={index + 1}
                name={item.name}
                points={item.totalPoints}
                avatarEmoji={item.avatarEmoji}
                isCurrentUser={item.isCurrentUser}
                onPress={item.isCurrentUser ? () => setTipVisible((v) => !v) : undefined}
              />
              {item.isCurrentUser && tipVisible && (
                <TouchableOpacity
                  style={[styles.tipCard, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
                  onPress={() => setTipVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tipText, { color: theme.colors.text }]}>{tip}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          onLayout={scrollToStudent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (activeSection === 'quests') {
      const questsList = getFilteredQuests();
      return (
        <FlatList
          data={questsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <QuestCard quest={item} onPress={() => router.push(`/arena/quest/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState text="Нет квестов" emoji="🗺️" color={theme.colors.textSecondary} />}
        />
      );
    }

    const challengesList = getFilteredChallenges();
    return (
      <FlatList
        data={challengesList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChallengeCard
            challenge={item}
            onPress={() => router.push(`/arena/challenge/${item.id}`)}
            onStart={() => startChallenge(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState text="Нет испытаний" emoji="🎯" color={theme.colors.textSecondary} />}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.colors.text }]}>Арена</Text>

        {/* Section tabs (hidden when only duels) */}
        {sections.length > 1 && (
          <View style={styles.sectionRow}>
            {sections.map((s) => {
              const active = activeSection === s.key;
              const count = sectionCounts[s.key];
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.sectionBtn,
                    {
                      borderBottomColor: active ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setSection(s.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sectionText, { color: active ? theme.colors.primary : theme.colors.textSecondary }]}>
                    {s.label}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.countBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.countBadgeText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {renderFilters()}
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

function EmptyState({ text, emoji, color }: { text: string; emoji: string; color: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={[styles.emptyText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', marginBottom: 12, gap: 4 },
  sectionBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  sectionText: { fontSize: 13, fontWeight: '700' },
  countBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  filterRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  tipCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  tipText: { fontSize: 14, lineHeight: 20 },
  createDuelBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  createDuelBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  list: { paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 12 },
  emptyText: { fontSize: 16, textAlign: 'center' },
});
