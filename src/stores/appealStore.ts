import { create } from 'zustand';
import { Appeal, AppealStatus } from '../types';

interface AppealState {
  appeals: Record<string, Appeal>;
  getAppeal: (homeworkId: string) => Appeal | undefined;
  submitAppeal: (data: {
    homeworkId: string;
    disagreementPoints: string[];
    reviewType: 'whole' | 'specific';
    comment: string;
    oldGrade: number;
  }) => void;
  simulateDecision: (homeworkId: string) => void;
}

const MOCK_TEACHER_COMMENTS = [
  'Перепроверила работу. Вы правы, ошибка была засчитана некорректно.',
  'Проверила ещё раз. Оценка выставлена верно, ошибки подтверждены.',
  'Частично согласна с замечаниями. Исправила оценку.',
];

export const useAppealStore = create<AppealState>((set, get) => ({
  appeals: {},

  getAppeal: (homeworkId) => get().appeals[homeworkId],

  submitAppeal: ({ homeworkId, disagreementPoints, reviewType, comment, oldGrade }) => {
    const appeal: Appeal = {
      homeworkId,
      status: 'pending',
      disagreementPoints,
      reviewType,
      comment,
      submittedAt: new Date(),
      oldGrade,
    };

    set((state) => ({
      appeals: { ...state.appeals, [homeworkId]: appeal },
    }));

    // Simulate teacher decision after 3 seconds
    setTimeout(() => get().simulateDecision(homeworkId), 3000);
  },

  simulateDecision: (homeworkId) => {
    const appeal = get().appeals[homeworkId];
    if (!appeal || appeal.status !== 'pending') return;

    const rand = Math.random();
    let status: AppealStatus;
    let newGrade: number | undefined;
    let teacherComment: string;

    if (rand < 0.4) {
      status = 'accepted';
      newGrade = Math.min((appeal.oldGrade ?? 3) + 1, 5);
      teacherComment = MOCK_TEACHER_COMMENTS[0];
    } else if (rand < 0.7) {
      status = 'rejected';
      newGrade = appeal.oldGrade;
      teacherComment = MOCK_TEACHER_COMMENTS[1];
    } else {
      status = 'mixed';
      newGrade = appeal.oldGrade;
      teacherComment = MOCK_TEACHER_COMMENTS[2];
    }

    const now = new Date();
    const decisionDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;

    const taskResponses =
      status === 'mixed'
        ? [
            { taskLabel: 'Задание 1', decision: 'agree' as const, teacherComment: 'Согласна, ошибка засчитана неверно' },
            { taskLabel: 'Задание 2', decision: 'disagree' as const, teacherComment: 'Ошибка подтверждена' },
          ]
        : undefined;

    set((state) => ({
      appeals: {
        ...state.appeals,
        [homeworkId]: {
          ...state.appeals[homeworkId],
          status,
          newGrade,
          teacherComment,
          decisionDate,
          teacherTaskResponses: taskResponses,
        },
      },
    }));
  },
}));
