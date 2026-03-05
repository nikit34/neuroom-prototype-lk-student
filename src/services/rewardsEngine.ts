import { useStudentStore } from '../stores/studentStore';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useArenaStore } from '../stores/arenaStore';
import { useAchievementStore } from '../stores/achievementStore';
import { Duel, Quest, Challenge } from '../types';

// ─── Reward Constants ────────────────────────────────────────────
const HOMEWORK_SUBMIT_XP = 50;
const HOMEWORK_SUBMIT_HEALTH = 5;
const MISSED_DEADLINE_HEALTH = -10;

const DUEL_WIN_MULTIPLIER = 1;
const DUEL_DRAW_MULTIPLIER = 0.5;
const DUEL_LOSE_MULTIPLIER = 0.25;

// ─── Streak → Health bonus ──────────────────────────────────────
// Longer streaks give bigger daily health boosts
const STREAK_HEALTH_TIERS = [
  { minDays: 14, health: 4 },
  { minDays: 7, health: 3 },
  { minDays: 3, health: 2 },
  { minDays: 1, health: 1 },
] as const;

/** Health bonus for current streak length (called on each homework submit) */
function getStreakHealthBonus(streak: number): number {
  for (const tier of STREAK_HEALTH_TIERS) {
    if (streak >= tier.minDays) return tier.health;
  }
  return 0;
}

// ─── Achievement Rules ───────────────────────────────────────────
interface AchievementRule {
  target: number;
  calc: (ctx: AchievementContext) => number;
}

interface AchievementContext {
  submittedHomework: number;
  streak: number;
  duelWins: number;
  completedQuests: number;
  perfectHomework: number;
}

const ACHIEVEMENT_RULES: Record<string, AchievementRule> = {
  'ach-1': { target: 1, calc: (ctx) => ctx.submittedHomework },
  'ach-2': { target: 5, calc: (ctx) => ctx.streak },
  'ach-3': { target: 14, calc: (ctx) => ctx.streak },
  'ach-4': { target: 30, calc: (ctx) => ctx.streak },
  'ach-5': { target: 100, calc: (ctx) => ctx.streak },
  'ach-6': { target: 3, calc: (ctx) => ctx.completedQuests },
  'ach-7': { target: 5, calc: (ctx) => ctx.completedQuests },
  'ach-8': { target: 10, calc: (ctx) => ctx.completedQuests },
  'ach-9': { target: 1, calc: (ctx) => ctx.duelWins },
  'ach-10': { target: 10, calc: (ctx) => ctx.duelWins },
  'ach-11': { target: 50, calc: (ctx) => ctx.duelWins },
  'ach-12': { target: 5, calc: (ctx) => ctx.perfectHomework },
  'ach-13': { target: 5, calc: (ctx) => ctx.perfectHomework },
  'ach-14': { target: 3, calc: (ctx) => ctx.perfectHomework },
  'ach-15': { target: 5, calc: (ctx) => ctx.submittedHomework },
  'ach-16': { target: 5, calc: (ctx) => ctx.submittedHomework },
  'ach-17': { target: 10, calc: (ctx) => ctx.submittedHomework },
  'ach-18': { target: 5, calc: (ctx) => ctx.perfectHomework },
};

// ─── Helper: build achievement context ───────────────────────────
function buildAchievementContext(): AchievementContext {
  const student = useStudentStore.getState().student;
  const assignments = useHomeworkStore.getState().assignments;
  const { duels, quests } = useArenaStore.getState();

  const submittedHomework = assignments.filter(
    (a) => a.status === 'submitted' || a.status === 'ai_reviewed' || a.status === 'graded',
  ).length;

  const perfectHomework = assignments.filter(
    (a) => a.status === 'graded' && a.grade != null && a.grade === a.maxGrade,
  ).length;

  const duelWins = duels.filter((d) => d.result === 'won').length;
  const completedQuests = quests.filter((q) => q.status === 'completed').length;

  return {
    submittedHomework,
    streak: student.currentStreak,
    duelWins,
    completedQuests,
    perfectHomework,
  };
}

// ─── Reward Functions ────────────────────────────────────────────

export function rewardHomeworkSubmit(homeworkId: string): void {
  const { addPoints, incrementStreak, updateMascotHealth } = useStudentStore.getState();

  incrementStreak();

  const streak = useStudentStore.getState().student.currentStreak;
  const streakBonus = getStreakHealthBonus(streak);

  addPoints(HOMEWORK_SUBMIT_XP);
  updateMascotHealth(HOMEWORK_SUBMIT_HEALTH + streakBonus);

  checkAchievements();
}

export function rewardHomeworkGraded(homeworkId: string, grade: number, maxGrade: number): void {
  const { addPoints } = useStudentStore.getState();

  const ratio = maxGrade > 0 ? grade / maxGrade : 0;
  const bonusXp = Math.round(ratio * 100);
  addPoints(bonusXp);

  checkAchievements();
}

export function penaltyMissedDeadline(): void {
  const { updateMascotHealth, resetStreak } = useStudentStore.getState();

  updateMascotHealth(MISSED_DEADLINE_HEALTH);
  resetStreak();
}

export function rewardDuelFinish(duel: Duel): void {
  const { addPoints } = useStudentStore.getState();

  let multiplier: number;
  switch (duel.result) {
    case 'won':
      multiplier = DUEL_WIN_MULTIPLIER;
      break;
    case 'draw':
      multiplier = DUEL_DRAW_MULTIPLIER;
      break;
    default:
      multiplier = DUEL_LOSE_MULTIPLIER;
      break;
  }

  const xp = Math.floor(duel.xpReward * multiplier);
  addPoints(xp);

  checkAchievements();
}

export function rewardQuestComplete(quest: Quest): void {
  const { addPoints } = useStudentStore.getState();

  addPoints(quest.xpReward);

  checkAchievements();
}

export function rewardChallengeComplete(challenge: Challenge): void {
  const { addPoints } = useStudentStore.getState();

  addPoints(challenge.reward.xp);

  checkAchievements();
}

export function checkAchievements(): void {
  const ctx = buildAchievementContext();
  const { achievements } = useAchievementStore.getState();
  const { updateProgress } = useAchievementStore.getState();

  for (const achievement of achievements) {
    const rule = ACHIEVEMENT_RULES[achievement.id];
    if (!rule) continue;

    const current = rule.calc(ctx);
    const progress = Math.min(100, Math.round((current / rule.target) * 100));

    if (progress !== achievement.progress) {
      updateProgress(achievement.id, progress);
    }
  }
}
