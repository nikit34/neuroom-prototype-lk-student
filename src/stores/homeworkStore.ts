import { create } from 'zustand';
import { HomeworkAssignment, HomeworkStatus, Submission } from '../types';
import { mockHomework, MOCK_BASE_TIME } from '../data/mockData';
import { rewardHomeworkSubmit, rewardHomeworkGraded } from '../services/rewardsEngine';

type FilterType = 'all' | 'active' | 'overdue' | 'done';
export type HomeLayout = 'mascot' | 'achievement' | 'minimal' | 'dashboard';

interface HomeworkState {
  assignments: HomeworkAssignment[];
  filter: FilterType;
  viewedCheckedIds: string[];
  devHideHomework: boolean;
  devShowProgressSummary: boolean;
  homeLayout: HomeLayout;
  setFilter: (f: FilterType) => void;
  setDevHideHomework: (v: boolean) => void;
  setDevShowProgressSummary: (v: boolean) => void;
  setHomeLayout: (v: HomeLayout) => void;
  getFiltered: () => HomeworkAssignment[];
  submitHomework: (id: string, submission: Submission) => void;
  updateStatus: (id: string, status: HomeworkStatus) => void;
  setGrade: (id: string, grade: number, feedback: string) => void;
  setAiFeedback: (id: string, feedback: string) => void;
  markCheckedViewed: (id: string) => void;
  resetAssignments: () => void;
}

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
  assignments: [...mockHomework],
  filter: 'all',
  viewedCheckedIds: [],
  devHideHomework: false,
  devShowProgressSummary: true,
  homeLayout: 'achievement' as HomeLayout,

  setFilter: (f) => set({ filter: f }),
  setDevHideHomework: (v) => set({ devHideHomework: v }),
  setDevShowProgressSummary: (v) => set({ devShowProgressSummary: v }),
  setHomeLayout: (v) => set({ homeLayout: v }),

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
          (a) => a.status === 'graded'
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

  markCheckedViewed: (id) =>
    set((state) =>
      state.viewedCheckedIds.includes(id)
        ? state
        : { viewedCheckedIds: [...state.viewedCheckedIds, id] }
    ),

  resetAssignments: () => {
    const offset = Date.now() - MOCK_BASE_TIME;
    const fresh = mockHomework.map((hw) => ({
      ...hw,
      deadline: new Date(hw.deadline.getTime() + offset),
      createdAt: new Date(hw.createdAt.getTime() + offset),
      submissions: hw.submissions.map((s) => ({
        ...s,
        submittedAt: new Date(s.submittedAt.getTime() + offset),
      })),
    }));
    set({ assignments: fresh, viewedCheckedIds: [] });
  },
}));
