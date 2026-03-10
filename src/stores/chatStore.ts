import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatAttachment } from '../types';
import { mockTeachers, mockStudent } from '../data/mockData';
import { useStudentStore } from './studentStore';
import { useThemeStore } from './themeStore';
import { themes, allCharacters, seniorThemes, juniorThemes, defaultTheme } from '../theme/themes';

export const AI_TUTOR_ID = 'ai-tutor';
export const AI_TUTOR_FREE_LIMIT = 25;

export type ChatOnboardingStep = 'gender' | 'theme' | 'character' | 'motivation' | 'learning_style' | 'goal' | 'confirm' | 'done';

const motivationOptions: { id: string; label: string; emoji: string }[] = [
  { id: 'grades', label: 'Получать хорошие оценки', emoji: '⭐' },
  { id: 'leaderboard', label: 'Быть лучшим в классе', emoji: '🏆' },
  { id: 'teamwork', label: 'Делать что-то в команде', emoji: '🤝' },
  { id: 'challenges', label: 'Челленджи и вызовы', emoji: '🎯' },
];

const learningStyleOptions: { id: string; label: string; emoji: string }[] = [
  { id: 'step_by_step', label: 'По шагам', emoji: '📝' },
  { id: 'examples', label: 'На примерах', emoji: '👀' },
  { id: 'practice', label: 'Решая задачи', emoji: '🧩' },
  { id: 'video', label: 'Через видео', emoji: '🎥' },
];

const goalOptions: { id: string; label: string; emoji: string }[] = [
  { id: 'improve_grades', label: 'Подтянуть оценки', emoji: '📈' },
  { id: 'keep_up', label: 'Не отставать от класса', emoji: '🎯' },
  { id: 'be_top', label: 'Стать лучшим учеником', emoji: '🥇' },
  { id: 'understand', label: 'Глубже разобраться', emoji: '🧠' },
];

interface TopicReplies {
  [topic: string]: string[];
}

const aiTutorReplies: TopicReplies = {
  hw_grade_explain: [
    'Давай разберёмся! Обычно оценка складывается из правильности решения, оформления и полноты ответа. Покажи задание — я объясню, за что могли снизить.',
    'Чаще всего баллы снижают за: неполный ответ, ошибки в вычислениях, пропущенные шаги решения. Присылай работу — разберём подробно!',
    'Я могу проанализировать твою работу и показать, где именно были недочёты. Скинь задание и своё решение!',
  ],
  hw_improve: [
    'Чтобы улучшить результат, обрати внимание на типичные ошибки: проверяй вычисления, пиши все шаги решения, не пропускай единицы измерения. Давай разберём конкретные недочёты!',
    'Попробуй сравнить своё решение с образцом. Обычно баллы теряют на оформлении и пропущенных шагах. Покажи работу — подскажу, что исправить!',
    'Главное — понять, какие ошибки повторяются. Присылай работу, и я составлю список того, на что обратить внимание в следующий раз.',
  ],
  hw_improve_general: [
    'Давай проанализируем твои прошлые работы! Я посмотрю на типичные ошибки и подскажу, на что обратить внимание. Какой предмет тебя интересует?',
    'Чтобы улучшить оценки, важно понять закономерности: где ты чаще всего теряешь баллы. Расскажи, по какому предмету хочешь улучшить результаты — разберёмся!',
    'Хороший подход! Обычно оценки улучшаются, когда ученик: 1) проверяет работу перед сдачей, 2) оформляет решение по шагам, 3) разбирает свои ошибки. Давай начнём с анализа твоих работ!',
  ],
  hw_error: [
    'Давай разберём ошибку пошагово. Покажи, какое выражение у тебя получилось, и я объясню, где именно пошло не так.',
    'Попробуй подставить числа в формулу ещё раз. Скорее всего, ошибка в знаке или порядке действий. Если не найдёшь — скинь решение, разберёмся вместе!',
    'Частая ошибка в таких задачах — неверный порядок действий. Проверь скобки и приоритет операций.',
  ],
  hw_conditions: [
    'Давай разберём условие вместе. Выдели ключевые данные и что именно нужно найти — я помогу составить план решения.',
    'Попробуй перефразировать задачу своими словами. Часто это помогает понять, что требуется. Я подскажу, если что-то упустишь.',
    'Обрати внимание на единицы измерения и ограничения в условии — обычно в них кроется подсказка.',
  ],
  hw_deadline: [
    'Я не могу продлить срок сдачи, но могу помочь решить задание быстрее! Давай разберём его вместе.',
    'По поводу сроков лучше написать учителю. А я могу помочь тебе ускориться — присылай задания!',
  ],
  hw_grade: [
    'Давай разберёмся, за что снизили. Покажи задание и своё решение — я покажу, где были ошибки и как их исправить.',
    'Я могу объяснить критерии оценки и показать, как нужно было решить. Присылай задание!',
  ],
  topic_help: [
    'Конечно! Расскажи, какая тема, и я объясню простым языком с примерами.',
    'Давай разберём тему! Начнём с основ — что именно вызывает затруднения?',
    'Хороший вопрос! Я подготовлю краткое объяснение с примерами. Какой именно аспект темы тебе непонятен?',
    'Эту тему лучше разбирать на примерах. Давай я объясню шаг за шагом!',
  ],
  general: [
    'Привет! Чем могу помочь? Задавай вопрос по любому предмету — разберёмся вместе!',
    'Интересный вопрос! Давай разберёмся. Можешь уточнить, что именно непонятно?',
    'Я готов помочь! Опиши задачу или тему подробнее, и мы разберём её вместе.',
    'Спрашивай что угодно — от математики до истории. Я здесь, чтобы помочь!',
    'Отличный вопрос! Давай подойдём к нему пошагово.',
    'Могу объяснить тему с нуля или помочь с конкретной задачей — как тебе удобнее?',
  ],
};

const topicReplies: TopicReplies = {
  hw_grade_explain: [
    'Оценка складывается из нескольких критериев: правильность решения, полнота ответа, оформление. Давайте разберём вашу работу подробнее — какой пункт хотите обсудить?',
    'Основные баллы были сняты за ошибки в вычислениях и неполное оформление решения. Пришлите свою работу — покажу конкретные места.',
    'Я посмотрю вашу работу ещё раз и дам подробный комментарий по каждому заданию. Отвечу в течение часа.',
    'Критерии оценки: правильность ответа, ход решения, оформление. Если хотите обсудить конкретный пункт — пишите.',
  ],
  hw_improve: [
    'Чтобы улучшить результат, обратите внимание на оформление: записывайте все шаги решения и проверяйте ответ.',
    'Рекомендую перед сдачей проверять работу по критериям оценки. Основные ошибки были в вычислениях — будьте внимательнее с цифрами.',
    'Попробуйте решить аналогичные задачи для закрепления. Если нужны дополнительные материалы — скажите, я подберу.',
  ],
  hw_improve_general: [
    'Посмотрю ваши работы и дам рекомендации. В целом советую: проверять работу перед сдачей, оформлять решение по шагам и задавать вопросы, если что-то непонятно.',
    'Чтобы улучшить оценки, рекомендую: 1) разбирать ошибки в проверенных работах, 2) решать дополнительные задачи, 3) не откладывать задания на последний день.',
    'Хорошо, что вы хотите улучшить результаты! Основное — научиться видеть свои типичные ошибки. Я подготовлю рекомендации на основе ваших прошлых работ.',
  ],
  hw_error: [
    'Пришлите фото с ошибкой, я посмотрю и объясню, где вы ошиблись.',
    'Давайте разберём ошибку. Какое задание вызвало затруднения?',
    'Хороший вопрос! Ошибка, скорее всего, в вычислениях — проверьте шаги решения.',
    'Я посмотрю вашу работу внимательнее и отвечу в течение часа.',
  ],
  hw_conditions: [
    'Какой именно пункт задания вам непонятен? Постараюсь объяснить проще.',
    'Попробуйте перечитать условие ещё раз. Если не поможет — спрашивайте конкретнее!',
    'Понимаю, бывает сложно. Давайте разберём условие по частям.',
    'Обратите внимание на ключевые слова в условии — обычно в них и кроется суть.',
  ],
  hw_deadline: [
    'К сожалению, я не могу продлить срок сдачи для одного ученика. Постарайтесь успеть вовремя!',
    'Давайте обсудим. Напишите причину, и я подумаю, что можно сделать.',
    'Если есть уважительная причина, я могу дать дополнительный день. Объясните ситуацию.',
    'Рекомендую начинать задание заранее. Но если что-то случилось — пишите.',
  ],
  hw_grade: [
    'Я ещё раз посмотрю вашу работу и дам подробный комментарий.',
    'Оценка выставлена по критериям. Какой пункт хотите обсудить?',
    'Давайте разберёмся. Пришлите своё решение, и я покажу, где были недочёты.',
    'Я проверю повторно. Если найду ошибку в оценке — исправлю.',
  ],
  topic_help: [
    'Какая именно тема? Я подготовлю дополнительные материалы.',
    'Рекомендую посмотреть параграф в учебнике и попробовать решить похожие примеры.',
    'Давайте разберём на следующем уроке. А пока попробуйте посмотреть видеоурок по теме.',
    'Хорошо, что спрашиваете! Я объясню подробнее на ближайшем уроке.',
  ],
  general: [
    'Спасибо за сообщение! Я посмотрю и отвечу подробнее позже.',
    'Хороший вопрос. Давайте обсудим это на следующем уроке.',
    'Принято. Не забудьте про сроки сдачи!',
    'Молодец, что интересуешься! Рекомендую почитать дополнительный материал в учебнике.',
    'Я проверю вашу работу сегодня вечером.',
    'Попробуйте решить задачу ещё раз, используя другой метод.',
    'Отличный прогресс! Продолжайте в том же духе.',
    'Загляните в параграф 12, там есть подсказка.',
  ],
};

function pickReply(topic: string, isAiTutor = false): string {
  const pool = isAiTutor ? aiTutorReplies : topicReplies;
  const replies = pool[topic] ?? pool.general;
  return replies[Math.floor(Math.random() * replies.length)];
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  teacherChatEnabled: boolean;
  aiTutorQuestionsUsed: number;
  aiTutorUnlocked: boolean;
  chatOnboardingStep: ChatOnboardingStep;
  setTeacherChatEnabled: (enabled: boolean) => void;
  sendMessage: (teacherId: string, text: string, topic?: string, attachments?: ChatAttachment[]) => void;
  getMessages: (teacherId: string) => ChatMessage[];
  setMessages: (messages: Record<string, ChatMessage[]>) => void;
  unlockAiTutor: () => void;
  resetAiTutorLimit: () => void;
  getAiTutorRemaining: () => number;
  isAiTutorLimitReached: () => boolean;
  initChatOnboarding: () => void;
  selectOnboardingOption: (optionId: string) => void;
  confirmOnboarding: () => void;
  resetChatOnboarding: () => void;
}

export const useChatStore = create<ChatState>()(persist((set, get) => ({
  messages: {},
  teacherChatEnabled: false,
  aiTutorQuestionsUsed: 0,
  aiTutorUnlocked: false,
  chatOnboardingStep: 'gender',
  setTeacherChatEnabled: (enabled) => set({ teacherChatEnabled: enabled }),

  unlockAiTutor: () => set({ aiTutorUnlocked: true }),
  resetAiTutorLimit: () => set({ aiTutorQuestionsUsed: 0, aiTutorUnlocked: false }),

  getAiTutorRemaining: () => {
    const state = get();
    if (state.aiTutorUnlocked) return Infinity;
    return Math.max(0, AI_TUTOR_FREE_LIMIT - state.aiTutorQuestionsUsed);
  },

  isAiTutorLimitReached: () => {
    const state = get();
    return !state.aiTutorUnlocked && state.aiTutorQuestionsUsed >= AI_TUTOR_FREE_LIMIT;
  },

  initChatOnboarding: () => {
    const state = get();
    const aiMessages = state.messages[AI_TUTOR_ID] ?? [];
    if (aiMessages.length > 0 || state.chatOnboardingStep === 'done') return;

    const student = useStudentStore.getState().student;

    const botMsg: ChatMessage = {
      id: 'msg-onb-gender',
      senderId: AI_TUTOR_ID,
      senderName: 'AI-Репетитор',
      text: `Давай настроим приложение под тебя.\n\nКто ты?`,
      timestamp: new Date(),
      isStudent: false,
      options: [
        { id: 'male', label: 'Парень', emoji: '🧑' },
        { id: 'female', label: 'Девушка', emoji: '👩' },
      ],
      optionType: 'gender',
    };

    set({
      messages: { ...state.messages, [AI_TUTOR_ID]: [botMsg] },
    });
  },

  selectOnboardingOption: (optionId) => {
    const state = get();
    const step = state.chatOnboardingStep;
    const messages = [...(state.messages[AI_TUTOR_ID] ?? [])];
    const now = Date.now();

    // Mark selected option on the last message
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      messages[messages.length - 1] = { ...last, selectedOptionId: optionId };
    }

    const student = useStudentStore.getState().student;

    if (step === 'gender') {
      const gender = optionId as 'male' | 'female';
      const label = gender === 'male' ? 'Парень' : 'Девушка';
      const emoji = gender === 'male' ? '🧑' : '👩';

      useStudentStore.getState().setGender(gender);
      useThemeStore.getState().setTheme('neuroom');

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: `${emoji} ${label}`,
        timestamp: new Date(),
        isStudent: true,
      };

      // Add student message, then bot reply with delay
      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const ageGroup = useThemeStore.getState().ageGroup;
        const grouped = ageGroup === 'senior' ? seniorThemes : juniorThemes;
        // Нейрум — дефолт для всех, всегда первым
        const availableThemes = grouped.some((t) => t.id === defaultTheme.id)
          ? grouped
          : [defaultTheme, ...grouped];

        const botMsg: ChatMessage = {
          id: `msg-onb-${now}-b`,
          senderId: AI_TUTOR_ID,
          senderName: 'AI-Репетитор',
          text: 'Теперь выбери оформление — его всегда можно сменить в профиле',
          timestamp: new Date(),
          isStudent: false,
          options: availableThemes.map((t) => ({
            id: t.id,
            label: t.name,
            emoji: t.emoji,
            colors: [t.colors.primary, t.colors.secondary, t.colors.accent] as [string, string, string],
          })),
          optionType: 'theme',
        };

        set((s) => ({
          chatOnboardingStep: 'theme',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    } else if (step === 'theme') {
      const theme = themes.find((t) => t.id === optionId);
      if (!theme) return;

      useThemeStore.getState().setTheme(optionId);

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: `${theme.emoji} ${theme.name}`,
        timestamp: new Date(),
        isStudent: true,
      };

      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `msg-onb-${now}-b`,
          senderId: AI_TUTOR_ID,
          senderName: 'AI-Репетитор',
          text: 'И последнее — выбери своего персонажа-компаньона',
          timestamp: new Date(),
          isStudent: false,
          options: allCharacters.map((c) => ({
            id: c.id,
            label: c.name,
            emoji: c.emoji,
          })),
          optionType: 'character',
        };

        set((s) => ({
          chatOnboardingStep: 'character',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    } else if (step === 'character') {
      const char = allCharacters.find((c) => c.id === optionId);
      if (!char) return;

      useThemeStore.getState().setCharacter(optionId);

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: `${char.emoji} ${char.name}`,
        timestamp: new Date(),
        isStudent: true,
      };

      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `msg-onb-${now}-b`,
          senderId: AI_TUTOR_ID,
          senderName: 'AI-Репетитор',
          text: 'Теперь пара вопросов, чтобы настроить всё под тебя.\n\nЧто тебе интереснее в учёбе?',
          timestamp: new Date(),
          isStudent: false,
          options: motivationOptions,
          optionType: 'motivation',
        };

        set((s) => ({
          chatOnboardingStep: 'motivation',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    } else if (step === 'motivation') {
      const isSkip = optionId === 'skip';
      const opt = motivationOptions.find((o) => o.id === optionId);
      if (!isSkip && !opt) return;

      if (!isSkip) useStudentStore.getState().setMotivation(optionId);

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: isSkip ? 'Пропущено' : `${opt!.emoji} ${opt!.label}`,
        timestamp: new Date(),
        isStudent: true,
      };

      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `msg-onb-${now}-b`,
          senderId: AI_TUTOR_ID,
          senderName: 'AI-Репетитор',
          text: 'Как тебе проще разбираться в новой теме?',
          timestamp: new Date(),
          isStudent: false,
          options: learningStyleOptions,
          optionType: 'learning_style',
        };

        set((s) => ({
          chatOnboardingStep: 'learning_style',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    } else if (step === 'learning_style') {
      const isSkip = optionId === 'skip';
      const opt = learningStyleOptions.find((o) => o.id === optionId);
      if (!isSkip && !opt) return;

      if (!isSkip) useStudentStore.getState().setLearningStyle(optionId);

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: isSkip ? 'Пропущено' : `${opt!.emoji} ${opt!.label}`,
        timestamp: new Date(),
        isStudent: true,
      };

      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `msg-onb-${now}-b`,
          senderId: AI_TUTOR_ID,
          senderName: 'AI-Репетитор',
          text: 'И последнее — какая у тебя цель на этот год?',
          timestamp: new Date(),
          isStudent: false,
          options: goalOptions,
          optionType: 'goal',
        };

        set((s) => ({
          chatOnboardingStep: 'goal',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    } else if (step === 'goal') {
      const isSkip = optionId === 'skip';
      const opt = goalOptions.find((o) => o.id === optionId);
      if (!isSkip && !opt) return;

      if (!isSkip) useStudentStore.getState().setGoal(optionId);

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: isSkip ? 'Пропущено' : `${opt!.emoji} ${opt!.label}`,
        timestamp: new Date(),
        isStudent: true,
      };

      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const currentStudent = useStudentStore.getState().student;
        const gender = currentStudent.gender;
        const genderLabel = gender === 'male' ? '🧑 Парень' : '👩 Девушка';
        const selectedTheme = themes.find((t) => t.id === useThemeStore.getState().themeId);
        const themeLabel = selectedTheme ? `${selectedTheme.emoji} ${selectedTheme.name}` : '';
        const char = allCharacters.find((c) => c.id === useThemeStore.getState().characterId);
        const charLabel = char ? `${char.emoji} ${char.name}` : '';
        const motiv = motivationOptions.find((o) => o.id === currentStudent.motivation);
        const style = learningStyleOptions.find((o) => o.id === currentStudent.learningStyle);
        const goalItem = goalOptions.find((o) => o.id === currentStudent.goal);

        const lines = [
          genderLabel,
          themeLabel,
          charLabel,
          motiv ? `${motiv.emoji} ${motiv.label}` : '',
          style ? `${style.emoji} ${style.label}` : '',
          goalItem ? `${goalItem.emoji} ${goalItem.label}` : '',
        ].filter(Boolean);

        const botMsg: ChatMessage = {
          id: `msg-onb-${now}-b`,
          senderId: AI_TUTOR_ID,
          senderName: 'AI-Репетитор',
          text: `Отлично! Вот что ты выбрал:\n\n${lines.join('\n')}\n\nВсё верно?`,
          timestamp: new Date(),
          isStudent: false,
          optionType: 'confirm',
        };

        set((s) => ({
          chatOnboardingStep: 'confirm',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    }
  },

  confirmOnboarding: () => {
    set((state) => ({
      chatOnboardingStep: 'done',
      messages: { ...state.messages, [AI_TUTOR_ID]: [] },
    }));
  },

  resetChatOnboarding: () => {
    set((state) => {
      const { [AI_TUTOR_ID]: _, ...rest } = state.messages;
      return {
        chatOnboardingStep: 'gender',
        messages: rest,
      };
    });
  },

  sendMessage: (teacherId, text, topic, attachments) => {
    const studentMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId: mockStudent.id,
      senderName: `${mockStudent.firstName} ${mockStudent.lastName}`,
      text,
      timestamp: new Date(),
      isStudent: true,
      attachments: attachments?.length ? attachments : undefined,
    };

    const isAi = teacherId === AI_TUTOR_ID;

    // Check limit before sending to AI tutor
    if (isAi && !get().aiTutorUnlocked && get().aiTutorQuestionsUsed >= AI_TUTOR_FREE_LIMIT) {
      return;
    }

    set((state) => ({
      messages: {
        ...state.messages,
        [teacherId]: [...(state.messages[teacherId] ?? []), studentMsg],
      },
      ...(isAi && !state.aiTutorUnlocked ? { aiTutorQuestionsUsed: state.aiTutorQuestionsUsed + 1 } : {}),
    }));

    const delay = isAi ? 1000 + Math.random() * 1500 : 3000 + Math.random() * 2000;
    const teacher = mockTeachers.find((t) => t.id === teacherId);

    setTimeout(() => {
      const teacherMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: teacherId,
        senderName: isAi
          ? 'AI-Репетитор'
          : teacher
            ? `${teacher.firstName} ${teacher.lastName}`
            : 'Учитель',
        text: pickReply(topic ?? 'general', isAi),
        timestamp: new Date(),
        isStudent: false,
      };

      set((state) => ({
        messages: {
          ...state.messages,
          [teacherId]: [...(state.messages[teacherId] ?? []), teacherMsg],
        },
      }));
    }, delay);
  },

  getMessages: (teacherId) => {
    return get().messages[teacherId] ?? [];
  },

  setMessages: (messages) => set({ messages }),
}), {
  name: 'neuroom-chat',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ chatOnboardingStep: state.chatOnboardingStep }),
}));
