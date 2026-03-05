import { create } from 'zustand';
import { Student } from '../types';
import { mockStudent } from '../data/mockData';

interface StudentState {
  student: Student;
  updateMascotHealth: (delta: number) => void;
  setMascotHealth: (health: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addPoints: (points: number) => void;
  setGender: (gender: 'male' | 'female') => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  student: { ...mockStudent },

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

  incrementStreak: () =>
    set((state) => ({
      student: {
        ...state.student,
        currentStreak: state.student.currentStreak + 1,
      },
    })),

  resetStreak: () =>
    set((state) => ({
      student: {
        ...state.student,
        currentStreak: 0,
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
