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
import { useChatStore } from '@/src/stores/chatStore';
import { mockTeachers } from '@/src/data/mockData';
import { Teacher } from '@/src/types';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

export default function ChatListScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const allMessages = useChatStore((s) => s.messages);

  const renderTeacher = ({ item }: { item: Teacher }) => {
    const messages = allMessages[item.id] ?? [];
    const lastMessage = messages[messages.length - 1];

    return (
      <TouchableOpacity
        style={[styles.teacherCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <Text style={styles.avatar}>👨‍🏫</Text>
        <View style={styles.teacherInfo}>
          <Text style={[styles.teacherName, { color: theme.colors.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.subject, { color: theme.colors.textSecondary }]}>
            {item.subject}
          </Text>
          {lastMessage && (
            <Text
              style={[styles.lastMessage, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {lastMessage.isStudent ? 'Вы: ' : ''}{lastMessage.text}
            </Text>
          )}
        </View>
        <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.colors.text }]}>Чат</Text>
        <FlatList
          data={mockTeachers}
          keyExtractor={(item) => item.id}
          renderItem={renderTeacher}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Нет доступных учителей
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  list: { paddingBottom: 100 },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: { fontSize: 32, marginRight: 12 },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  subject: { fontSize: 13, marginBottom: 2 },
  lastMessage: { fontSize: 13 },
  arrow: { fontSize: 24, fontWeight: '300' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 12 },
  emptyText: { fontSize: 16, textAlign: 'center' },
});
