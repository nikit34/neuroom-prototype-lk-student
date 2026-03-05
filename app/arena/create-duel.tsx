import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useArenaStore } from '@/src/stores/arenaStore';
import { mockClassmates } from '@/src/data/mockData';
import Card from '@/src/components/ui/Card';
import type { Classmate } from '@/src/types';

const SUBJECTS = ['Математика', 'Физика', 'История'];

export default function CreateDuelScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const createDuel = useArenaStore((s) => s.createDuel);

  const [selectedOpponent, setSelectedOpponent] = useState<Classmate | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleCreate = () => {
    if (!selectedOpponent || !selectedSubject) return;
    const duelId = createDuel(selectedOpponent, selectedSubject);
    router.replace(`/arena/duel/${duelId}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.colors.text }]}>Вызвать на дуэль</Text>

        {/* Subject selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Выберите предмет</Text>
        <View style={styles.subjectRow}>
          {SUBJECTS.map((s) => {
            const active = selectedSubject === s;
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.subjectBtn,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedSubject(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.subjectText, { color: active ? '#FFF' : theme.colors.text }]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Opponent selection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Выберите соперника</Text>
        <FlatList
          data={mockClassmates}
          keyExtractor={(item) => item.id}
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
              backgroundColor: selectedOpponent && selectedSubject ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={handleCreate}
          disabled={!selectedOpponent || !selectedSubject}
          activeOpacity={0.7}
        >
          <Text style={styles.createBtnText}>
            {selectedOpponent && selectedSubject
              ? `Вызвать ${selectedOpponent.firstName}!`
              : 'Выберите предмет и соперника'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  subjectRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  subjectBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  subjectText: { fontSize: 14, fontWeight: '600' },
  opponentCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14 },
  opponentEmoji: { fontSize: 32, marginRight: 12 },
  opponentInfo: { flex: 1 },
  opponentName: { fontSize: 16, fontWeight: '600' },
  opponentPoints: { fontSize: 13, marginTop: 2 },
  checkmark: { fontSize: 22, fontWeight: '700' },
  list: { paddingBottom: 80 },
  createBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
