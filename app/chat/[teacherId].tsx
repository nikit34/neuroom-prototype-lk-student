import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useChatStore, AI_TUTOR_ID } from '@/src/stores/chatStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { mockTeachers } from '@/src/data/mockData';
import { ChatMessage } from '@/src/types';
import { formatDateRu } from '@/src/utils/dateHelpers';

interface Suggest {
  label: string;
  message: string;
  topic: string;
}

function buildSuggests(
  homework: { title: string; status: string; grade?: number; maxGrade: number }[],
  subject: string,
): Suggest[] {
  const result: Suggest[] = [];

  for (const hw of homework) {
    const t = hw.title;

    if (hw.status === 'pending' || hw.status === 'submitted') {
      result.push({
        label: `📋 «${t}» — непонятны условия`,
        message: `Здравствуйте! Не совсем понимаю условия задания «${t}». Можете объяснить подробнее?`,
        topic: 'hw_conditions',
      });
      result.push({
        label: `⏰ «${t}» — продлить дедлайн`,
        message: `Здравствуйте! Не успеваю сдать «${t}» вовремя. Можно ли продлить срок?`,
        topic: 'hw_deadline',
      });
    }

    if (hw.status === 'ai_reviewed' || hw.status === 'resubmit') {
      result.push({
        label: `❓ «${t}» — ошибка в решении`,
        message: `Здравствуйте! Получил замечания по «${t}», но не понимаю, в чём ошибка. Можете объяснить?`,
        topic: 'hw_error',
      });
    }

    if (hw.status === 'graded' && hw.grade != null) {
      result.push({
        label: `📊 «${t}» — вопрос по оценке (${hw.grade}/${hw.maxGrade})`,
        message: `Здравствуйте! У меня вопрос по оценке ${hw.grade}/${hw.maxGrade} за «${t}». Можете пояснить критерии?`,
        topic: 'hw_grade',
      });
    }
  }

  result.push({
    label: `📖 Не понимаю тему по ${subject}`,
    message: `Здравствуйте! Не до конца разобрался в текущей теме по предмету «${subject}». Можете подсказать, на что обратить внимание?`,
    topic: 'topic_help',
  });

  return result;
}

export default function ChatScreen() {
  const { teacherId, dispute, hwTitle, grade } = useLocalSearchParams<{
    teacherId: string;
    dispute?: string;
    hwTitle?: string;
    grade?: string;
  }>();
  const theme = useAppTheme();
  const sendMessage = useChatStore((s) => s.sendMessage);
  const storeMessages = useChatStore((s) => s.messages[teacherId]);
  const messages = useMemo(() => storeMessages ?? [], [storeMessages]);
  const assignments = useHomeworkStore((s) => s.assignments);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const hasSentDispute = useRef(false);

  const navigation = useNavigation();
  const isAiTutor = teacherId === AI_TUTOR_ID;
  const teacher = mockTeachers.find((t) => t.id === teacherId);
  const teacherName = isAiTutor
    ? 'AI-Репетитор'
    : teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : 'Учитель';

  useEffect(() => {
    navigation.setOptions({
      title: isAiTutor
        ? '🤖 AI-Репетитор'
        : `${teacherName}${teacher ? ` · ${teacher.subject}` : ''}`,
    });
  }, [navigation, teacherName, teacher?.subject, isAiTutor]);

  // Homework for this teacher (all homework for AI tutor)
  const teacherHomework = isAiTutor
    ? assignments
    : assignments.filter((hw) => hw.teacher.id === teacherId);

  const aiSuggests: Suggest[] = useMemo(() => [
    { label: '📖 Объясни тему', message: 'Привет! Можешь объяснить мне текущую тему простым языком?', topic: 'topic_help' },
    { label: '❓ Помоги с задачей', message: 'У меня не получается решить задачу. Можешь помочь разобраться?', topic: 'hw_error' },
    { label: '📝 Проверь моё решение', message: 'Можешь проверить моё решение и сказать, есть ли ошибки?', topic: 'hw_error' },
    { label: '🧠 Подготовка к контрольной', message: 'Помоги подготовиться к контрольной! С чего начать?', topic: 'topic_help' },
  ], []);

  const suggests = useMemo(
    () => isAiTutor ? aiSuggests : buildSuggests(teacherHomework, teacher?.subject ?? ''),
    [isAiTutor, aiSuggests, teacherHomework, teacher?.subject],
  );

  // Send initial dispute message
  useEffect(() => {
    if (dispute === 'true' && hwTitle && !hasSentDispute.current) {
      hasSentDispute.current = true;
      const disputeMessage = `Здравствуйте! Я хотел бы оспорить оценку ${grade || ''} за задание "${decodeURIComponent(hwTitle)}". Мне кажется, оценка не совсем справедлива. Не могли бы вы пересмотреть мою работу?`;
      sendMessage(teacherId, disputeMessage, 'hw_grade');
    }
  }, [dispute, hwTitle, grade, teacherId]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(teacherId, trimmed);
    setText('');
  };

  const handleSuggest = (suggest: Suggest) => {
    sendMessage(teacherId, suggest.message, suggest.topic);
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
    <KeyboardAvoidingView
      style={[styles.keyboardView, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatEmoji}>💬</Text>
                <Text style={[styles.emptyChatText, { color: theme.colors.textSecondary }]}>
                  Выберите тему или напишите сообщение
                </Text>
              </View>
            ) : null
          }
        />

        {/* Suggests */}
        {suggests.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestsScroll}
            contentContainerStyle={styles.suggestsRow}
            keyboardShouldPersistTaps="handled"
          >
            {suggests.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => handleSuggest(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestText, { color: theme.colors.text }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

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
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
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
    paddingVertical: 40,
  },
  emptyChatEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  emptyChatText: {
    fontSize: 14,
  },
  // Suggests
  suggestsScroll: {
    flexGrow: 0,
  },
  suggestsRow: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  suggestChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Input
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
