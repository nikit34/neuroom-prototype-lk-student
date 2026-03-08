import { create } from 'zustand';
import { ChatMessage } from '../types';
import { mockTeachers, mockStudent } from '../data/mockData';

interface TopicReplies {
  [topic: string]: string[];
}

const topicReplies: TopicReplies = {
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
    'К сожалению, я не могу продлить дедлайн для одного ученика. Постарайтесь успеть вовремя!',
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
    'Принято. Не забудьте про дедлайн!',
    'Молодец, что интересуешься! Рекомендую почитать дополнительный материал в учебнике.',
    'Я проверю вашу работу сегодня вечером.',
    'Попробуйте решить задачу ещё раз, используя другой метод.',
    'Отличный прогресс! Продолжайте в том же духе.',
    'Загляните в параграф 12, там есть подсказка.',
  ],
};

function pickReply(topic: string): string {
  const replies = topicReplies[topic] ?? topicReplies.general;
  return replies[Math.floor(Math.random() * replies.length)];
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  sendMessage: (teacherId: string, text: string, topic?: string) => void;
  getMessages: (teacherId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},

  sendMessage: (teacherId, text, topic) => {
    const studentMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId: mockStudent.id,
      senderName: `${mockStudent.firstName} ${mockStudent.lastName}`,
      text,
      timestamp: new Date(),
      isStudent: true,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [teacherId]: [...(state.messages[teacherId] ?? []), studentMsg],
      },
    }));

    const delay = 3000 + Math.random() * 2000;
    const teacher = mockTeachers.find((t) => t.id === teacherId);

    setTimeout(() => {
      const teacherMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: teacherId,
        senderName: teacher
          ? `${teacher.firstName} ${teacher.lastName}`
          : 'Учитель',
        text: pickReply(topic ?? 'general'),
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
}));
