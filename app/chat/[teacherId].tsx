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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useChatStore, AI_TUTOR_ID, AI_TUTOR_FREE_LIMIT } from '@/src/stores/chatStore';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { mockTeachers } from '@/src/data/mockData';
import { ChatMessage, ChatAttachment, ChatMessageOption } from '@/src/types';
import { formatDateRu } from '@/src/utils/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
        label: `⏰ «${t}» — продлить срок`,
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
  const { teacherId, dispute, hwTitle, grade, hwPromptSubject, hwPromptText } = useLocalSearchParams<{
    teacherId: string;
    dispute?: string;
    hwTitle?: string;
    grade?: string;
    hwPromptSubject?: string;
    hwPromptText?: string;
  }>();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const isAiTutor = teacherId === AI_TUTOR_ID;
  const sendMessage = useChatStore((s) => s.sendMessage);
  const storeMessages = useChatStore((s) => s.messages[teacherId]);
  const messages = useMemo(() => storeMessages ?? [], [storeMessages]);
  const aiTutorQuestionsUsed = useChatStore((s) => s.aiTutorQuestionsUsed);
  const aiTutorUnlocked = useChatStore((s) => s.aiTutorUnlocked);
  const unlockAiTutor = useChatStore((s) => s.unlockAiTutor);
  const aiLimitReached = isAiTutor && !aiTutorUnlocked && aiTutorQuestionsUsed >= AI_TUTOR_FREE_LIMIT;
  const aiRemaining = isAiTutor && !aiTutorUnlocked ? AI_TUTOR_FREE_LIMIT - aiTutorQuestionsUsed : -1;
  const assignments = useHomeworkStore((s) => s.assignments);

  // Chat onboarding
  const chatOnboardingStep = useChatStore((s) => s.chatOnboardingStep);
  const initChatOnboarding = useChatStore((s) => s.initChatOnboarding);
  const selectOnboardingOption = useChatStore((s) => s.selectOnboardingOption);
  const confirmOnboarding = useChatStore((s) => s.confirmOnboarding);
  const resetChatOnboarding = useChatStore((s) => s.resetChatOnboarding);
  const isOnboarding = isAiTutor && chatOnboardingStep !== 'done';
  const router = useRouter();

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const hasSentDispute = useRef(false);

  const navigation = useNavigation();
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

  // Init chat onboarding if needed
  useEffect(() => {
    if (isAiTutor && chatOnboardingStep !== 'done') {
      initChatOnboarding();
    }
  }, [isAiTutor]);

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

  const handleConfirmOnboarding = () => {
    confirmOnboarding();
    router.replace('/(tabs)');
  };

  const handleChangeOnboarding = () => {
    resetChatOnboarding();
    // Re-init after reset so the first question appears again
    setTimeout(() => {
      initChatOnboarding();
    }, 100);
  };

  const renderOptions = (item: ChatMessage) => {
    if (item.optionType === 'confirm' && !item.selectedOptionId) {
      return (
        <View style={styles.confirmContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleConfirmOnboarding}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Подтвердить выбор</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changeButton, { borderColor: theme.colors.border }]}
            onPress={handleChangeOnboarding}
            activeOpacity={0.8}
          >
            <Text style={[styles.changeButtonText, { color: theme.colors.textSecondary }]}>Изменить выбор</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!item.options || item.selectedOptionId) return null;

    if (item.optionType === 'gender') {
      return (
        <View style={styles.genderOptionsRow}>
          {item.options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.genderOptionCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => selectOnboardingOption(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.genderOptionEmoji}>{opt.emoji}</Text>
              <Text style={[styles.genderOptionLabel, { color: theme.colors.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (item.optionType === 'theme') {
      return (
        <View style={styles.themeOptionsGrid}>
          {item.options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.themeOptionCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => selectOnboardingOption(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.themeOptionEmoji}>{opt.emoji}</Text>
              <Text
                style={[styles.themeOptionLabel, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
              {opt.colors && (
                <View style={styles.colorDotsRow}>
                  {opt.colors.map((c, i) => (
                    <View key={i} style={[styles.colorDot, { backgroundColor: c }]} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (item.optionType === 'character') {
      return (
        <View style={styles.characterOptionsGrid}>
          {item.options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.characterOptionCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => selectOnboardingOption(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.characterOptionEmoji}>{opt.emoji}</Text>
              <Text
                style={[styles.characterOptionLabel, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isStudent = item.isStudent;
    const hasActiveOptions = (item.options || item.optionType === 'confirm') && !item.selectedOptionId;

    return (
      <View
        style={[
          styles.messageRow,
          isStudent ? styles.messageRowRight : styles.messageRowLeft,
          hasActiveOptions && styles.messageRowFull,
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
        {renderOptions(item)}
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
          contentContainerStyle={[styles.messagesList, isOnboarding && styles.onboardingList]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            hwPromptText ? (
              <View style={[styles.hwPromptCard, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} style={{ marginTop: 2 }} />
                <View style={styles.hwPromptContent}>
                  <Text style={[styles.hwPromptSubject, { color: theme.colors.primary }]}>
                    {hwPromptSubject}
                  </Text>
                  <Text style={[styles.hwPromptText, { color: theme.colors.text }]}>
                    {hwPromptText}
                  </Text>
                </View>
              </View>
            ) : null
          }
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

        {/* Suggests — hide during onboarding */}
        {!isOnboarding && suggests.length > 0 && !aiLimitReached && (
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

        {/* AI tutor remaining counter — hide during onboarding */}
        {!isOnboarding && isAiTutor && !aiTutorUnlocked && !aiLimitReached && (
          <View style={[styles.aiCounterBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="chatbubbles-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.aiCounterText, { color: theme.colors.textSecondary }]}>
              Осталось вопросов: <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>{aiRemaining}</Text> из {AI_TUTOR_FREE_LIMIT}
            </Text>
          </View>
        )}

        {/* AI tutor limit reached banner */}
        {aiLimitReached && (
          <View style={[styles.aiLimitBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={styles.aiLimitEmoji}>🔒</Text>
            <Text style={[styles.aiLimitTitle, { color: theme.colors.text }]}>
              Лимит бесплатных вопросов исчерпан
            </Text>
            <Text style={[styles.aiLimitDesc, { color: theme.colors.textSecondary }]}>
              Вы использовали {AI_TUTOR_FREE_LIMIT} бесплатных вопросов. Получите полный доступ к AI-репетитору без ограничений.
            </Text>
            <TouchableOpacity
              style={[styles.aiUnlockButton, { backgroundColor: theme.colors.primary }]}
              onPress={unlockAiTutor}
              activeOpacity={0.7}
            >
              <Ionicons name="lock-open-outline" size={18} color="#FFFFFF" />
              <Text style={styles.aiUnlockText}>Получить полный доступ</Text>
            </TouchableOpacity>
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

        {/* Input — hide during onboarding */}
        {!isOnboarding && (
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
              style={[styles.attachButton, aiLimitReached && { opacity: 0.3 }]}
              onPress={handleAttach}
              activeOpacity={0.7}
              disabled={aiLimitReached}
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
                aiLimitReached && { opacity: 0.5 },
              ]}
              value={text}
              onChangeText={setText}
              placeholder={aiLimitReached ? 'Лимит вопросов исчерпан' : 'Написать сообщение...'}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!aiLimitReached}
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
        )}
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
  messageRowFull: {
    maxWidth: '100%',
    alignSelf: 'stretch',
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

  onboardingList: {
    paddingTop: 80,
  },

  // ── Onboarding options ──
  genderOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    width: '100%',
  },
  genderOptionCard: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
  },
  genderOptionEmoji: {
    fontSize: 40,
  },
  genderOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  themeOptionCard: {
    width: (SCREEN_WIDTH - 32 - 24) / 3,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  themeOptionEmoji: {
    fontSize: 24,
  },
  themeOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  colorDotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  characterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  characterOptionCard: {
    width: (SCREEN_WIDTH - 32 - 24) / 3,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  characterOptionEmoji: {
    fontSize: 28,
  },
  characterOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Confirm
  confirmContainer: {
    marginTop: 12,
    width: '100%',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  changeButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    marginTop: 8,
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // AI tutor limit
  aiCounterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  aiCounterText: {
    fontSize: 13,
  },
  aiLimitBanner: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  aiLimitEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  aiLimitTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  aiLimitDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  aiUnlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aiUnlockText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
  // HW prompt card
  hwPromptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    marginHorizontal: 0,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  hwPromptContent: {
    flex: 1,
  },
  hwPromptSubject: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  hwPromptText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
