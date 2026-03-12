import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useChatStore, AI_TUTOR_ID } from '@/src/stores/chatStore';
import { mockTeachers } from '@/src/data/mockData';
import { Teacher } from '@/src/types';
import ThemeBackground from '@/src/components/theme/ThemeBackground';
import Avatar from '@/src/components/ui/Avatar';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';

export default function ChatListScreen() {
  const theme = useAppTheme();
  const age = useAgeStyles();
  const router = useRouter();
  const allMessages = useChatStore((s) => s.messages);
  const teacherChatEnabled = useChatStore((s) => s.teacherChatEnabled);
  const didRedirect = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (teacherChatEnabled) {
        didRedirect.current = false;
        return;
      }
      if (!didRedirect.current) {
        // First focus — push to AI tutor
        didRedirect.current = true;
        router.push(`/chat/${AI_TUTOR_ID}`);
      } else {
        // Came back from AI tutor via "back" — skip this screen, go to home tab
        didRedirect.current = false;
        router.navigate('/(tabs)');
      }
    }, [teacherChatEnabled]),
  );

  const aiMessages = allMessages[AI_TUTOR_ID] ?? [];
  const aiLastMessage = aiMessages[aiMessages.length - 1];

  const renderTeacher = ({ item }: { item: Teacher }) => {
    const messages = allMessages[item.id] ?? [];
    const lastMessage = messages[messages.length - 1];

    return (
      <TouchableOpacity
        style={[styles.teacherCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrap}>
          <Avatar size={40} neutral />
        </View>
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
      <View style={[styles.container, { paddingHorizontal: age.contentPadding }]}>
        <Text style={[styles.header, { color: theme.colors.text, fontSize: age.headerSize }]}>
          {age.isJunior ? '💬 Чат' : 'Чат'}
        </Text>

        {/* AI-Репетитор */}
        <TouchableOpacity
          style={[styles.aiTutorCard, { borderColor: theme.colors.primary }]}
          onPress={() => router.push(`/chat/${AI_TUTOR_ID}`)}
          activeOpacity={0.7}
        >
          <View style={[styles.aiAvatarWrap, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.aiAvatar}>🤖</Text>
          </View>
          <View style={styles.teacherInfo}>
            <View style={styles.aiNameRow}>
              <Text style={[styles.teacherName, { color: theme.colors.text }]}>
                AI-Репетитор
              </Text>
              <View style={[styles.aiBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={[styles.subject, { color: theme.colors.primary }]}>
              Помощь по всем предметам
            </Text>
            {aiLastMessage ? (
              <Text
                style={[styles.lastMessage, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {aiLastMessage.isStudent ? 'Вы: ' : ''}{aiLastMessage.text}
              </Text>
            ) : (
              <Text
                style={[styles.lastMessage, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                Задай вопрос по любому предмету
              </Text>
            )}
          </View>
          <Text style={[styles.arrow, { color: theme.colors.primary }]}>›</Text>
        </TouchableOpacity>

        {teacherChatEnabled && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
              Учителя
            </Text>

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
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  list: { paddingBottom: 100 },
  // AI Tutor card
  aiTutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 16,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  aiAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiAvatar: { fontSize: 24 },
  aiNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Teacher cards
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatarWrap: { marginRight: 12 },
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  subject: { fontSize: 13, marginBottom: 2 },
  lastMessage: { fontSize: 13 },
  arrow: { fontSize: 24, fontWeight: '300' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 12 },
  emptyText: { fontSize: 16, textAlign: 'center' },
});
