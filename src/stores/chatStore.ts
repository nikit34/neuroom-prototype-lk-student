import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatAttachment } from '../types';
import { mockTeachers, mockStudent } from '../data/mockData';
import { useStudentStore } from './studentStore';
import { useThemeStore } from './themeStore';


export const AI_TUTOR_ID = 'ai-tutor';
export const AI_TUTOR_FREE_LIMIT = 25;

export type ChatOnboardingStep = 'gender' | 'games' | 'shows' | 'confirm' | 'done';

const gamesOptions: { id: string; label: string; emoji: string }[] = [
  { id: 'minecraft', label: 'Minecraft', emoji: '⛏️' },
  { id: 'roblox', label: 'Roblox', emoji: '🧱' },
  { id: 'fortnite', label: 'Fortnite', emoji: '🔫' },
  { id: 'csgo', label: 'CS:GO', emoji: '💣' },
  { id: 'brawl_stars', label: 'Brawl Stars', emoji: '⭐' },
];

const showsOptions: { id: string; label: string; emoji: string }[] = [
  { id: 'anime', label: 'Аниме', emoji: '🎌' },
  { id: 'tiktok', label: 'TikTok', emoji: '📱' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️' },
  { id: 'series', label: 'Сериалы', emoji: '🎬' },
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
  submitMultiSelectOnboarding: (ids: string[], customText?: string) => void;
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
    // Guard: reset old persisted steps that no longer exist
    const validSteps: ChatOnboardingStep[] = ['gender', 'games', 'shows', 'confirm', 'done'];
    if (!validSteps.includes(state.chatOnboardingStep)) {
      set({ chatOnboardingStep: 'gender' });
    }
    const step = validSteps.includes(state.chatOnboardingStep) ? state.chatOnboardingStep : 'gender';
    const aiMessages = state.messages[AI_TUTOR_ID] ?? [];
    if (aiMessages.length > 0 || step === 'done') return;

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

      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `msg-onb-${now}-b`,
          senderId: AI_TUTOR_ID,
          senderName: 'AI-Репетитор',
          text: 'Во что играешь? Можно выбрать несколько',
          timestamp: new Date(),
          isStudent: false,
          options: gamesOptions,
          optionType: 'games',
        };

        set((s) => ({
          chatOnboardingStep: 'games',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    }
  },

  submitMultiSelectOnboarding: (ids, customText) => {
    const state = get();
    const step = state.chatOnboardingStep;
    const messages = [...(state.messages[AI_TUTOR_ID] ?? [])];
    const now = Date.now();

    const student = useStudentStore.getState().student;
    const isSkip = ids.length === 0 && !customText;

    // Mark the last bot message with selected IDs
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      messages[messages.length - 1] = { ...last, selectedOptionIds: ids, selectedOptionId: 'multi' };
    }

    if (step === 'games') {
      const allIds = [...ids];
      if (customText) allIds.push(customText);

      if (!isSkip) useStudentStore.getState().setGames(allIds);

      const labelParts = ids.map((id) => {
        const g = gamesOptions.find((o) => o.id === id);
        return g ? g.label : id;
      });
      if (customText) labelParts.push(customText);

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: isSkip ? 'Пропущено' : `🎮 ${labelParts.join(', ')}`,
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
          text: 'А что смотришь / листаешь?',
          timestamp: new Date(),
          isStudent: false,
          options: showsOptions,
          optionType: 'shows',
        };

        set((s) => ({
          chatOnboardingStep: 'shows',
          messages: {
            ...s.messages,
            [AI_TUTOR_ID]: [...(s.messages[AI_TUTOR_ID] ?? []), botMsg],
          },
        }));
      }, 600);
    } else if (step === 'shows') {
      const allIds = [...ids];
      if (customText) allIds.push(customText);

      if (!isSkip) useStudentStore.getState().setShows(allIds);

      const labelParts = ids.map((id) => {
        const s = showsOptions.find((o) => o.id === id);
        return s ? s.label : id;
      });
      if (customText) labelParts.push(customText);

      const studentMsg: ChatMessage = {
        id: `msg-onb-${now}-s`,
        senderId: student.id,
        senderName: `${student.firstName} ${student.lastName}`,
        text: isSkip ? 'Пропущено' : `📺 ${labelParts.join(', ')}`,
        timestamp: new Date(),
        isStudent: true,
      };

      set({
        messages: { ...state.messages, [AI_TUTOR_ID]: [...messages, studentMsg] },
      });

      setTimeout(() => {
        const currentStudent = useStudentStore.getState().student;
        const genderLabel = currentStudent.gender === 'male' ? '🧑 Парень' : '👩 Девушка';

        const gamesLabels = (currentStudent.games ?? []).map((gid) => {
          const g = gamesOptions.find((o) => o.id === gid);
          return g ? `${g.emoji} ${g.label}` : gid;
        });
        const showsLabels = (currentStudent.shows ?? []).map((sid) => {
          const sh = showsOptions.find((o) => o.id === sid);
          return sh ? `${sh.emoji} ${sh.label}` : sid;
        });

        const lines = [
          genderLabel,
          gamesLabels.length > 0 ? `🎮 ${gamesLabels.map((l) => l.replace(/^.+? /, '')).join(', ')}` : '',
          showsLabels.length > 0 ? `📺 ${showsLabels.map((l) => l.replace(/^.+? /, '')).join(', ')}` : '',
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
    const student = useStudentStore.getState().student;
    const sharedInterests = (student.games ?? []).length > 0 || (student.shows ?? []).length > 0;
    const { setHomeLayout } = require('./homeworkStore').useHomeworkStore.getState();
    setHomeLayout(sharedInterests ? 'mascot' : 'dashboard');

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
