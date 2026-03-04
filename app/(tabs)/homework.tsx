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
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import HomeworkCard from '@/src/components/homework/HomeworkCard';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

type FilterType = 'all' | 'active' | 'overdue' | 'done';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'overdue', label: 'Просроченные' },
  { key: 'done', label: 'Готово' },
];

export default function HomeworkScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const filter = useHomeworkStore((s) => s.filter);
  const setFilter = useHomeworkStore((s) => s.setFilter);
  const getFiltered = useHomeworkStore((s) => s.getFiltered);

  const filtered = getFiltered();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.colors.text }]}>
          Домашние задания
        </Text>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HomeworkCard
              homework={item}
              onPress={() => router.push(`/homework/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Нет заданий в этой категории
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
