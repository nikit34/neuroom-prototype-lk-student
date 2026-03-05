import { create } from 'zustand';
import { Student } from '../types';
import { mockStudent, StudentListItem } from '../data/mockData';

interface StudentState {
  student: Student;
  selectStudent: (item: StudentListItem) => void;
  updateMascotHealth: (delta: number) => void;
  setMascotHealth: (health: number) => void;
  incrementEarlyStreak: () => void;
  resetEarlyStreak: () => void;
  setXpMultiplier: (multiplier: number) => void;
  addPoints: (points: number) => void;
  setGender: (gender: 'male' | 'female') => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  student: { ...mockStudent },

  selectStudent: (item) =>
    set({
      student: {
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        gender: item.gender,
        grade: item.grade,
        classId: item.classId,
        mascotHealth: 70,
        earlyStreak: 0,
        xpMultiplier: 1,
        totalPoints: 0,
      },
    }),

  updateMascotHealth: (delta) =>
    set((state) => ({
      student: {
        ...state.student,
        mascotHealth: Math.max(0, Math.min(100, state.student.mascotHealth + delta)),
      },
    })),

  setMascotHealth: (health) =>
    set((state) => ({
      student: {
        ...state.student,
        mascotHealth: Math.max(0, Math.min(100, health)),
      },
    })),

  incrementEarlyStreak: () =>
    set((state) => ({
      student: {
        ...state.student,
        earlyStreak: state.student.earlyStreak + 1,
      },
    })),

  resetEarlyStreak: () =>
    set((state) => ({
      student: {
        ...state.student,
        earlyStreak: 0,
        xpMultiplier: 1,
      },
    })),

  setXpMultiplier: (multiplier) =>
    set((state) => ({
      student: {
        ...state.student,
        xpMultiplier: multiplier,
      },
    })),

  addPoints: (points) =>
    set((state) => ({
      student: {
        ...state.student,
        totalPoints: state.student.totalPoints + points,
      },
    })),

  setGender: (gender) =>
    set((state) => ({
      student: {
        ...state.student,
        gender,
      },
    })),
}));
