import React from 'react';
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
import DuelCard from '@/src/components/arena/DuelCard';
import QuestCard from '@/src/components/arena/QuestCard';
import ChallengeCard from '@/src/components/arena/ChallengeCard';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

type Section = 'duels' | 'quests' | 'challenges';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'duels', label: 'Дуэли ⚔️' },
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
    quests: quests.filter((q) => q.status === 'active').length,
    challenges: challenges.filter((c) => c.status === 'active').length,
  };

  const renderFilters = () => {
    const filters = section === 'duels' ? DUEL_FILTERS : section === 'quests' ? QUEST_FILTERS : CHALLENGE_FILTERS;
    const current = section === 'duels' ? duelFilter : section === 'quests' ? questFilter : challengeFilter;
    const setFn = section === 'duels' ? setDuelFilter : section === 'quests' ? setQuestFilter : setChallengeFilter;

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
    if (section === 'duels') {
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
          ListEmptyComponent={<EmptyState text="Нет дуэлей" emoji="⚔️" color={theme.colors.textSecondary} />}
        />
      );
    }

    if (section === 'quests') {
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

        {/* Section tabs */}
        <View style={styles.sectionRow}>
          {SECTIONS.map((s) => {
            const active = section === s.key;
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
  list: { paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 12 },
  emptyText: { fontSize: 16, textAlign: 'center' },
});
