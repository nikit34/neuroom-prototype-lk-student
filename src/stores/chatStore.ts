import { create } from 'zustand';
import { ChatMessage } from '../types';
import { mockTeachers, mockStudent } from '../data/mockData';

const teacherAutoReplies: string[] = [
  'Спасибо за сообщение! Я посмотрю и отвечу подробнее позже.',
  'Хороший вопрос. Давайте обсудим это на следующем уроке.',
  'Принято. Не забудьте про дедлайн!',
  'Молодец, что интересуешься! Рекомендую почитать дополнительный материал в учебнике.',
  'Я проверю вашу работу сегодня вечером.',
  'Попробуйте решить задачу ещё раз, используя другой метод.',
  'Отличный прогресс! Продолжайте в том же духе.',
  'Загляните в параграф 12, там есть подсказка.',
];

function randomReply(): string {
  return teacherAutoReplies[Math.floor(Math.random() * teacherAutoReplies.length)];
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  sendMessage: (teacherId: string, text: string) => void;
  getMessages: (teacherId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},

  sendMessage: (teacherId, text) => {
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

    // Auto-reply from teacher after 3-5 seconds
    const delay = 3000 + Math.random() * 2000;
    const teacher = mockTeachers.find((t) => t.id === teacherId);

    setTimeout(() => {
      const teacherMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: teacherId,
        senderName: teacher
          ? `${teacher.firstName} ${teacher.lastName}`
          : 'Учитель',
        text: randomReply(),
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
