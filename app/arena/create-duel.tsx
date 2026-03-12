import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useArenaStore } from '@/src/stores/arenaStore';
import { useStudentStore } from '@/src/stores/studentStore';
import { mockClassmates } from '@/src/data/mockData';
import Card from '@/src/components/ui/Card';
import type { Classmate } from '@/src/types';

interface CategoryItem {
  label: string;
  emoji: string;
  subject: string;
}

const SCHOOL_SUBJECTS: CategoryItem[] = [
  { label: 'Математика', emoji: '📐', subject: 'Математика' },
  { label: 'Русский язык', emoji: '📝', subject: 'Русский язык' },
  { label: 'Физика', emoji: '⚡', subject: 'Физика' },
  { label: 'История', emoji: '📜', subject: 'История' },
];

const INTEREST_CATEGORIES: CategoryItem[] = [
  { label: 'Игры', emoji: '🎮', subject: 'Игры' },
  { label: 'Сериалы и фильмы', emoji: '🎬', subject: 'Сериалы и фильмы' },
  { label: 'Факты о мире', emoji: '🌍', subject: 'Факты о мире' },
  { label: 'Музыка', emoji: '🎵', subject: 'Музыка' },
];

const LEVELS = [5, 6, 7, 8, 9, 10, 11];

export default function CreateDuelScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const createDuel = useArenaStore((s) => s.createDuel);
  const studentGrade = useStudentStore((s) => s.student.grade);

  const [selectedOpponent, setSelectedOpponent] = useState<Classmate | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(studentGrade);

  const handleCreate = () => {
    if (!selectedOpponent || !selectedSubject) return;
    const duelId = createDuel(selectedOpponent, selectedSubject);
    router.replace(`/arena/duel/${duelId}`);
  };

  const renderCategoryButton = (item: CategoryItem) => {
    const active = selectedSubject === item.subject;
    return (
      <TouchableOpacity
        key={item.subject}
        style={[
          styles.categoryBtn,
          {
            backgroundColor: active ? theme.colors.primary : theme.colors.surface,
            borderColor: active ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => setSelectedSubject(item.subject)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryEmoji}>{item.emoji}</Text>
        <Text
          style={[styles.categoryLabel, { color: active ? '#FFF' : theme.colors.text }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.colors.text }]}>Вызвать на дуэль</Text>

        <FlatList
          data={mockClassmates}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {/* Level selector */}
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                Уровень сложности
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.levelScroll}
                contentContainerStyle={styles.levelRow}
              >
                {LEVELS.map((lvl) => {
                  const active = selectedLevel === lvl;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.levelBtn,
                        {
                          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedLevel(lvl)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.levelText, { color: active ? '#FFF' : theme.colors.text }]}
                      >
                        {lvl} класс
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* School subjects */}
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                Учебные предметы
              </Text>
              <View style={styles.categoryGrid}>
                {SCHOOL_SUBJECTS.map(renderCategoryButton)}
              </View>

              {/* Interest categories */}
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                По интересам
              </Text>
              <View style={styles.categoryGrid}>
                {INTEREST_CATEGORIES.map(renderCategoryButton)}
              </View>

              {/* Opponent selection */}
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                Выберите соперника
              </Text>
            </>
          }
          renderItem={({ item }) => {
            const active = selectedOpponent?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedOpponent(item)}
                activeOpacity={0.7}
              >
                <Card
                  style={{
                    ...styles.opponentCard,
                    ...(active ? { borderColor: theme.colors.primary, borderWidth: 2 } : {}),
                  }}
                >
                  <Text style={styles.opponentEmoji}>{item.avatarEmoji}</Text>
                  <View style={styles.opponentInfo}>
                    <Text style={[styles.opponentName, { color: theme.colors.text }]}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={[styles.opponentPoints, { color: theme.colors.textSecondary }]}>
                      {item.totalPoints} очков
                    </Text>
                  </View>
                  {active && (
                    <Text style={[styles.checkmark, { color: theme.colors.primary }]}>✓</Text>
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        {/* Create button */}
        <TouchableOpacity
          style={[
            styles.createBtn,
            {
              backgroundColor:
                selectedOpponent && selectedSubject ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={handleCreate}
          disabled={!selectedOpponent || !selectedSubject}
          activeOpacity={0.7}
        >
          <Text style={styles.createBtnText}>
            {selectedOpponent && selectedSubject
              ? `Вызвать ${selectedOpponent.firstName}!`
              : 'Выберите категорию и соперника'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  levelScroll: { marginBottom: 4 },
  levelRow: { gap: 8 },
  levelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelText: { fontSize: 14, fontWeight: '600' },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  categoryEmoji: { fontSize: 18 },
  categoryLabel: { fontSize: 14, fontWeight: '600' },
  opponentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  opponentEmoji: { fontSize: 32, marginRight: 12 },
  opponentInfo: { flex: 1 },
  opponentName: { fontSize: 16, fontWeight: '600' },
  opponentPoints: { fontSize: 13, marginTop: 2 },
  checkmark: { fontSize: 22, fontWeight: '700' },
  list: { paddingBottom: 100 },
  createBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  createBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
