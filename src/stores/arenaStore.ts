import { create } from 'zustand';
import { Duel, DuelStatus, Quest, QuestStatus, Challenge, ChallengeStatus, Classmate } from '../types';
import { mockArenaDuels, mockQuests, mockChallenges, mockDuelQuestions, mockClassmates } from '../data/mockData';
import { rewardDuelFinish, rewardQuestComplete, rewardChallengeComplete } from '../services/rewardsEngine';

type ArenaSection = 'duels' | 'leaderboard' | 'quests' | 'challenges' | 'achievements';
type DuelFilter = 'all' | 'pending' | 'active' | 'finished';
type QuestFilter = 'all' | 'active' | 'available' | 'completed';
type ChallengeFilter = 'all' | 'active' | 'available' | 'completed' | 'expired';

interface ArenaState {
  section: ArenaSection;
  setSection: (s: ArenaSection) => void;

  // Feature toggles (dev mode)
  questsEnabled: boolean;
  challengesEnabled: boolean;
  setQuestsEnabled: (v: boolean) => void;
  setChallengesEnabled: (v: boolean) => void;

  // Duels
  duels: Duel[];
  duelFilter: DuelFilter;
  setDuelFilter: (f: DuelFilter) => void;
  getFilteredDuels: () => Duel[];
  acceptDuel: (id: string) => void;
  declineDuel: (id: string) => void;
  answerDuelQuestion: (duelId: string, answerIndex: number) => void;
  getDuelStats: () => { wins: number; losses: number; draws: number; active: number };
  createDuel: (opponent: Classmate, subject: string) => string;

  // Quests
  quests: Quest[];
  questFilter: QuestFilter;
  setQuestFilter: (f: QuestFilter) => void;
  getFilteredQuests: () => Quest[];
  joinQuest: (id: string) => void;
  completeQuestStep: (questId: string, stepId: string) => void;

  // Challenges
  challenges: Challenge[];
  challengeFilter: ChallengeFilter;
  setChallengeFilter: (f: ChallengeFilter) => void;
  getFilteredChallenges: () => Challenge[];
  startChallenge: (id: string) => void;
  updateChallengeProgress: (id: string, amount: number) => void;
}

export const useArenaStore = create<ArenaState>((set, get) => ({
  section: 'duels',
  setSection: (s) => set({ section: s }),

  questsEnabled: false,
  challengesEnabled: false,
  setQuestsEnabled: (v) => set({ questsEnabled: v }),
  setChallengesEnabled: (v) => set({ challengesEnabled: v }),

  // ─── Duels ──────────────────────────────────────────────────────
  duels: [...mockArenaDuels],
  duelFilter: 'all',
  setDuelFilter: (f) => set({ duelFilter: f }),

  getFilteredDuels: () => {
    const { duels, duelFilter } = get();
    if (duelFilter === 'all') return duels;
    return duels.filter((d) => d.status === duelFilter);
  },

  acceptDuel: (id) =>
    set((state) => ({
      duels: state.duels.map((d) =>
        d.id === id ? { ...d, status: 'active' as DuelStatus } : d,
      ),
    })),

  declineDuel: (id) =>
    set((state) => ({
      duels: state.duels.filter((d) => d.id !== id),
    })),

  answerDuelQuestion: (duelId, answerIndex) => {
    set((state) => ({
      duels: state.duels.map((d) => {
        if (d.id !== duelId || d.status !== 'active') return d;

        const q = d.questions[d.currentQuestionIndex];
        if (!q) return d;

        const isCorrect = answerIndex === q.correctIndex;
        const newChallengerAnswers = [...d.challenger.answers];
        newChallengerAnswers[d.currentQuestionIndex] = answerIndex;

        // Simulate opponent answer
        const opponentCorrect = Math.random() > 0.45;
        const opponentAnswer = opponentCorrect
          ? q.correctIndex
          : (q.correctIndex + 1 + Math.floor(Math.random() * 3)) % 4;
        const newOpponentAnswers = [...d.opponent.answers];
        newOpponentAnswers[d.currentQuestionIndex] = opponentAnswer;

        const newIndex = d.currentQuestionIndex + 1;
        const isFinished = newIndex >= d.questions.length;

        const challengerScore = d.challenger.score + (isCorrect ? 1 : 0);
        const opponentScore = d.opponent.score + (opponentCorrect ? 1 : 0);

        let result: typeof d.result = d.result;
        let status: DuelStatus = d.status;
        if (isFinished) {
          status = 'finished';
          if (challengerScore > opponentScore) result = 'won';
          else if (challengerScore < opponentScore) result = 'lost';
          else result = 'draw';
        }

        return {
          ...d,
          status: status as DuelStatus,
          result,
          currentQuestionIndex: newIndex,
          challenger: { ...d.challenger, score: challengerScore, answers: newChallengerAnswers },
          opponent: { ...d.opponent, score: opponentScore, answers: newOpponentAnswers },
        };
      }),
    }));
    const updatedDuel = get().duels.find((d) => d.id === duelId);
    if (updatedDuel && updatedDuel.status === 'finished') {
      rewardDuelFinish(updatedDuel);
    }
  },

  getDuelStats: () => {
    const { duels } = get();
    return {
      wins: duels.filter((d) => d.result === 'won').length,
      losses: duels.filter((d) => d.result === 'lost').length,
      draws: duels.filter((d) => d.result === 'draw').length,
      active: duels.filter((d) => d.status === 'active' || d.status === 'pending').length,
    };
  },

  createDuel: (opponent, subject) => {
    const questions = mockDuelQuestions
      .filter((q) => q.subject === subject)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const id = `arena-duel-${Date.now()}`;
    const newDuel: Duel = {
      id,
      type: 'classmate',
      subject,
      status: 'pending',
      result: null,
      challenger: { id: 'student-1', name: 'Алексей Петров', avatarEmoji: '🐺', score: 0, answers: questions.map(() => null) },
      opponent: { id: opponent.id, name: `${opponent.firstName} ${opponent.lastName}`, avatarEmoji: opponent.avatarEmoji, score: 0, answers: questions.map(() => null) },
      questions,
      currentQuestionIndex: 0,
      xpReward: 50,
      createdAt: new Date(),
      isIncoming: false,
    };

    set((state) => ({ duels: [newDuel, ...state.duels] }));
    return id;
  },

  // ─── Quests ─────────────────────────────────────────────────────
  quests: [...mockQuests],
  questFilter: 'all',
  setQuestFilter: (f) => set({ questFilter: f }),

  getFilteredQuests: () => {
    const { quests, questFilter } = get();
    if (questFilter === 'all') return quests;
    return quests.filter((q) => q.status === questFilter);
  },

  joinQuest: (id) =>
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'active' as QuestStatus,
              teamMembers: [
                ...q.teamMembers,
                { id: 'student-1', name: 'Алексей Петров', avatarEmoji: '🐺', contribution: 0 },
              ],
            }
          : q,
      ),
    })),

  completeQuestStep: (questId, stepId) => {
    const questBefore = get().quests.find((q) => q.id === questId);
    const wasDone = questBefore?.status === 'completed';
    set((state) => ({
      quests: state.quests.map((q) => {
        if (q.id !== questId) return q;
        const newSteps = q.steps.map((s) =>
          s.id === stepId ? { ...s, isCompleted: true } : s,
        );
        const allDone = newSteps.every((s) => s.isCompleted);
        return {
          ...q,
          steps: newSteps,
          status: allDone ? ('completed' as QuestStatus) : q.status,
        };
      }),
    }));
    const questAfter = get().quests.find((q) => q.id === questId);
    if (questAfter && questAfter.status === 'completed' && !wasDone) {
      rewardQuestComplete(questAfter);
    }
  },

  // ─── Challenges ─────────────────────────────────────────────────
  challenges: [...mockChallenges],
  challengeFilter: 'all',
  setChallengeFilter: (f) => set({ challengeFilter: f }),

  getFilteredChallenges: () => {
    const { challenges, challengeFilter } = get();
    if (challengeFilter === 'all') return challenges;
    return challenges.filter((c) => c.status === challengeFilter);
  },

  startChallenge: (id) =>
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === id ? { ...c, status: 'active' as ChallengeStatus } : c,
      ),
    })),

  updateChallengeProgress: (id, amount) => {
    const challengeBefore = get().challenges.find((c) => c.id === id);
    const wasDone = challengeBefore?.status === 'completed';
    set((state) => ({
      challenges: state.challenges.map((c) => {
        if (c.id !== id) return c;
        const newProgress = Math.min(c.progress + amount, c.target);
        const isCompleted = newProgress >= c.target;
        return {
          ...c,
          progress: newProgress,
          status: isCompleted ? ('completed' as ChallengeStatus) : c.status,
        };
      }),
    }));
    const challengeAfter = get().challenges.find((c) => c.id === id);
    if (challengeAfter && challengeAfter.status === 'completed' && !wasDone) {
      rewardChallengeComplete(challengeAfter);
    }
  },
}));
