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
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useChatStore, AI_TUTOR_ID } from '@/src/stores/chatStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { mockTeachers } from '@/src/data/mockData';
import { ChatMessage, ChatAttachment } from '@/src/types';
import { formatDateRu } from '@/src/utils/dateHelpers';

interface Suggest {
  label: string;
  message: string;
  topic: string;
}

const SUGGEST_H_PAD = 10 * 2;
const SUGGEST_BORDER = 2;
const SUGGEST_FONT = 12;
const CHAR_WIDTH = 6.5;
const WRAP_GAP = 6;
const WRAP_PAD = 12 * 2;

function estimateChipWidth(label: string): number {
  return label.length * CHAR_WIDTH * SUGGEST_FONT / 12 + SUGGEST_H_PAD + SUGGEST_BORDER;
}

/** Reorder suggests so they pack into fewest rows (first-fit-decreasing). */
function packSuggests(items: Suggest[]): Suggest[] {
  const containerWidth = Dimensions.get('window').width - WRAP_PAD;
  const indexed = items.map((s, i) => ({ s, w: estimateChipWidth(s.label), i }));
  indexed.sort((a, b) => b.w - a.w);

  const rows: { remaining: number; items: typeof indexed }[] = [];
  for (const item of indexed) {
    let placed = false;
    for (const row of rows) {
      if (row.remaining >= item.w + WRAP_GAP) {
        row.items.push(item);
        row.remaining -= item.w + WRAP_GAP;
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push({ remaining: containerWidth - item.w, items: [item] });
    }
  }

  return rows.flatMap((r) => r.items.map((x) => x.s));
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
        label: `📊 «${t}» — почему такая оценка (${hw.grade}/${hw.maxGrade})`,
        message: `Здравствуйте! Хотел бы понять, почему я получил ${hw.grade}/${hw.maxGrade} за «${t}». Можете объяснить, за что снизили и что конкретно было не так?`,
        topic: 'hw_grade_explain',
      });
      result.push({
        label: `📈 «${t}» — как улучшить результат`,
        message: `Здравствуйте! Получил ${hw.grade}/${hw.maxGrade} за «${t}». Подскажите, что мне нужно исправить и как в следующий раз получить оценку лучше?`,
        topic: 'hw_improve',
      });
    }
  }

  // General (not tied to specific homework) suggests
  const hasGradedWork = homework.some((hw) => hw.status === 'graded' && hw.grade != null);
  if (hasGradedWork) {
    result.push({
      label: `🎯 Как получать лучше оценки по ${subject}`,
      message: `Здравствуйте! Хотел бы улучшить свои оценки по предмету «${subject}». Можете посмотреть на мои прошлые работы и подсказать, на что обратить внимание, чтобы результаты были лучше?`,
      topic: 'hw_improve_general',
    });
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
  const insets = useSafeAreaInsets();
  const sendMessage = useChatStore((s) => s.sendMessage);
  const storeMessages = useChatStore((s) => s.messages[teacherId]);
  const messages = useMemo(() => storeMessages ?? [], [storeMessages]);
  const assignments = useHomeworkStore((s) => s.assignments);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
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
    { label: '📊 Почему такая оценка', message: 'Привет! Не понимаю, почему мне поставили такую оценку. Можешь объяснить, что было не так?', topic: 'hw_grade_explain' },
    { label: '📈 Как улучшить оценки', message: 'Привет! Хочу получать оценки лучше. Можешь посмотреть мои прошлые работы и подсказать, что исправить?', topic: 'hw_improve_general' },
    { label: '❓ Помоги с задачей', message: 'У меня не получается решить задачу. Можешь помочь разобраться?', topic: 'hw_error' },
    { label: '📝 Проверь моё решение', message: 'Можешь проверить моё решение и сказать, есть ли ошибки?', topic: 'hw_error' },
    { label: '🧠 Подготовка к контрольной', message: 'Помоги подготовиться к контрольной! С чего начать?', topic: 'topic_help' },
  ], []);

  const suggests = useMemo(
    () => packSuggests(isAiTutor ? aiSuggests : buildSuggests(teacherHomework, teacher?.subject ?? '')),
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

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    const msgText = trimmed || (attachments.length === 1 ? 'Файл' : `Файлы (${attachments.length})`);
    sendMessage(teacherId, msgText, undefined, attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
  };

  const handleSuggest = (suggest: Suggest) => {
    sendMessage(teacherId, suggest.message, suggest.topic);
  };

  const handleAttach = () => {
    Alert.alert('Прикрепить', undefined, [
      { text: 'Фото из галереи', onPress: pickImage },
      { text: 'Документ', onPress: pickDocument },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newFiles: ChatAttachment[] = result.assets.map((a) => ({
        uri: a.uri,
        type: 'image' as const,
        name: a.fileName ?? undefined,
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled) {
      const newFiles: ChatAttachment[] = result.assets.map((a) => ({
        uri: a.uri,
        type: 'document' as const,
        name: a.name,
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.msgAttachments}>
              {item.attachments.map((att, idx) =>
                att.type === 'image' ? (
                  <Image key={idx} source={{ uri: att.uri }} style={styles.msgImage} />
                ) : (
                  <View key={idx} style={[styles.msgDocBadge, { backgroundColor: isStudent ? 'rgba(255,255,255,0.2)' : theme.colors.background }]}>
                    <Ionicons name="document-outline" size={16} color={isStudent ? '#fff' : theme.colors.textSecondary} />
                    <Text style={[styles.msgDocName, { color: isStudent ? '#fff' : theme.colors.text }]} numberOfLines={1}>
                      {att.name || 'Документ'}
                    </Text>
                  </View>
                ),
              )}
            </View>
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
          <View style={styles.suggestsWrap}>
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
          </View>
        )}

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.attachPreviewScroll, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}
            contentContainerStyle={styles.attachPreviewRow}
            keyboardShouldPersistTaps="handled"
          >
            {attachments.map((att, idx) => (
              <View key={idx} style={styles.attachPreviewItem}>
                {att.type === 'image' ? (
                  <Image source={{ uri: att.uri }} style={styles.attachThumb} />
                ) : (
                  <View style={[styles.attachDocThumb, { backgroundColor: theme.colors.background }]}>
                    <Ionicons name="document-outline" size={22} color={theme.colors.textSecondary} />
                    <Text style={[styles.attachDocName, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {att.name || 'Файл'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.attachRemove}
                  onPress={() => removeAttachment(idx)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
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
              paddingBottom: Math.max(12, insets.bottom),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttach}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
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
                backgroundColor: hasContent
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={handleSend}
            disabled={!hasContent}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
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
  suggestsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  // Attachment previews
  attachPreviewScroll: {
    flexGrow: 0,
    borderTopWidth: 1,
  },
  attachPreviewRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  attachPreviewItem: {
    position: 'relative',
  },
  attachThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  attachDocThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  attachDocName: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  attachRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  // Message attachments
  msgAttachments: {
    marginBottom: 6,
    gap: 4,
  },
  msgImage: {
    width: 180,
    height: 130,
    borderRadius: 10,
  },
  msgDocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  msgDocName: {
    fontSize: 13,
    maxWidth: 140,
  },
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  attachButton: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
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
});
