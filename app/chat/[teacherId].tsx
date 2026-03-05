import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useChatStore } from '@/src/stores/chatStore';
import { mockTeachers } from '@/src/data/mockData';
import { ChatMessage } from '@/src/types';
import { formatDateRu } from '@/src/utils/dateHelpers';

export default function ChatScreen() {
  const { teacherId, dispute, hwTitle, grade } = useLocalSearchParams<{
    teacherId: string;
    dispute?: string;
    hwTitle?: string;
    grade?: string;
  }>();
  const theme = useAppTheme();
  const sendMessage = useChatStore((s) => s.sendMessage);
  const messages = useChatStore((s) => s.getMessages(teacherId));
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const hasSentDispute = useRef(false);

  const teacher = mockTeachers.find((t) => t.id === teacherId);
  const teacherName = teacher
    ? `${teacher.firstName} ${teacher.lastName}`
    : 'Учитель';

  // Send initial dispute message
  useEffect(() => {
    if (dispute === 'true' && hwTitle && !hasSentDispute.current) {
      hasSentDispute.current = true;
      const disputeMessage = `Здравствуйте! Я хотел бы оспорить оценку ${grade || ''} за задание "${decodeURIComponent(hwTitle)}". Мне кажется, оценка не совсем справедлива. Не могли бы вы пересмотреть мою работу?`;
      sendMessage(teacherId, disputeMessage);
    }
  }, [dispute, hwTitle, grade, teacherId]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(teacherId, trimmed);
    setText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isStudent = item.isStudent;
    return (
      <View
        style={[
          styles.messageRow,
          isStudent ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isStudent
                ? theme.colors.primary
                : theme.colors.surface,
              borderColor: isStudent
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          {!isStudent && (
            <Text
              style={[styles.senderName, { color: theme.colors.secondary }]}
            >
              {item.senderName}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              { color: isStudent ? '#FFFFFF' : theme.colors.text },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              {
                color: isStudent
                  ? 'rgba(255,255,255,0.7)'
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {formatDateRu(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Header */}
        <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border }]}>
          <Text style={styles.chatHeaderEmoji}>👨‍🏫</Text>
          <Text style={[styles.chatHeaderName, { color: theme.colors.text }]}>
            {teacherName}
          </Text>
          {teacher && (
            <Text style={[styles.chatHeaderSubject, { color: theme.colors.textSecondary }]}>
              {teacher.subject}
            </Text>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>💬</Text>
              <Text style={[styles.emptyChatText, { color: theme.colors.textSecondary }]}>
                Начните диалог с учителем
              </Text>
            </View>
          }
        />

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Написать сообщение..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: text.trim()
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={handleSend}
            disabled={!text.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>📨</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  chatHeaderEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  chatHeaderSubject: {
    fontSize: 13,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  emptyChat: {
    alignItems: 'center',
    paddingTop: 60,
    transform: [{ scaleY: -1 }],
  },
  emptyChatEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyChatText: {
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 20,
  },
});
