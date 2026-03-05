import { create } from 'zustand';
import { HomeworkAssignment, HomeworkStatus, Submission } from '../types';
import { mockHomework } from '../data/mockData';
import { rewardHomeworkSubmit, rewardHomeworkGraded } from '../services/rewardsEngine';

type FilterType = 'all' | 'active' | 'overdue' | 'done';

interface HomeworkState {
  assignments: HomeworkAssignment[];
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  getFiltered: () => HomeworkAssignment[];
  submitHomework: (id: string, submission: Submission) => void;
  updateStatus: (id: string, status: HomeworkStatus) => void;
  setGrade: (id: string, grade: number, feedback: string) => void;
  setAiFeedback: (id: string, feedback: string) => void;
}

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
  assignments: [...mockHomework],
  filter: 'all',

  setFilter: (f) => set({ filter: f }),

  getFiltered: () => {
    const { assignments, filter } = get();
    const now = Date.now();

    switch (filter) {
      case 'active':
        return assignments.filter(
          (a) =>
            (a.status === 'pending' || a.status === 'resubmit') &&
            a.deadline.getTime() >= now
        );
      case 'overdue':
        return assignments.filter(
          (a) =>
            (a.status === 'pending' || a.status === 'resubmit') &&
            a.deadline.getTime() < now
        );
      case 'done':
        return assignments.filter(
          (a) =>
            a.status === 'graded' ||
            a.status === 'submitted' ||
            a.status === 'ai_reviewed'
        );
      default:
        return assignments;
    }
  },

  submitHomework: (id, submission) => {
    const assignment = get().assignments.find((a) => a.id === id);
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'submitted' as HomeworkStatus,
              submissions: [...a.submissions, submission],
            }
          : a
      ),
    }));
    if (assignment) {
      rewardHomeworkSubmit(assignment);
    }
  },

  updateStatus: (id, status) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),

  setGrade: (id, grade, feedback) => {
    const assignment = get().assignments.find((a) => a.id === id);
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === id
          ? {
              ...a,
              grade,
              teacherFeedback: feedback,
              status: 'graded' as HomeworkStatus,
            }
          : a
      ),
    }));
    if (assignment) {
      rewardHomeworkGraded(id, grade, assignment.maxGrade);
    }
  },

  setAiFeedback: (id, feedback) =>
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === id
          ? {
              ...a,
              aiFeedback: feedback,
              status: 'ai_reviewed' as HomeworkStatus,
            }
          : a
      ),
    })),
}));
