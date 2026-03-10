import { create } from 'zustand';
import { AppNotification } from '../types';

const now = Date.now();
const MINUTE = 60_000;

const mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'chat_reply',
    title: 'Ольга Смирнова',
    message: 'Ответила на ваше сообщение',
    icon: '💬',
    isRead: false,
    createdAt: new Date(now - MINUTE * 5),
    route: '/chat/teacher-1',
  },
  {
    id: 'notif-2',
    type: 'duel_challenge',
    title: 'Вызов на дуэль!',
    message: 'Артём Федоров — История',
    icon: '⚔️',
    isRead: false,
    createdAt: new Date(now - MINUTE * 12),
    route: '/arena/duel/arena-duel-6',
  },
  {
    id: 'notif-3',
    type: 'homework_graded',
    title: 'Работа оценена',
    message: 'Физика — Законы Ньютона: 4/5',
    icon: '📝',
    isRead: false,
    createdAt: new Date(now - MINUTE * 30),
    route: '/homework/hw-3',
  },
  {
    id: 'notif-4',
    type: 'chat_reply',
    title: 'Игорь Волков',
    message: 'Ответил на ваше сообщение',
    icon: '💬',
    isRead: true,
    createdAt: new Date(now - MINUTE * 60),
    route: '/chat/teacher-3',
  },
  {
    id: 'notif-5',
    type: 'duel_result',
    title: 'Дуэль завершена',
    message: 'Победа! +50 XP',
    icon: '🏆',
    isRead: true,
    createdAt: new Date(now - MINUTE * 120),
    route: '/arena/duel/arena-duel-3',
  },
];

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: () => number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: AppNotification[]) => void;
  removeNotification: (id: string) => void;
  removeNotificationsByRoute: (routePrefix: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  setNotifications: (notifications) => set({ notifications }),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  removeNotificationsByRoute: (routePrefix) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (n) => !n.route || !n.route.startsWith(routePrefix),
      ),
    })),
}));
