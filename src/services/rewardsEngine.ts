import { useStudentStore } from '../stores/studentStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useRewardStore } from '../stores/rewardStore';
import { Duel, Quest, Challenge, HomeworkAssignment, LootChestResult } from '../types';

// ─── Reward Constants ────────────────────────────────────────────
const HOMEWORK_SUBMIT_HEALTH = 5;
const MISSED_DEADLINE_HEALTH = -10;

const DUEL_WIN_MULTIPLIER = 1;
const DUEL_DRAW_MULTIPLIER = 0.5;
const DUEL_LOSE_MULTIPLIER = 0.25;

// ─── Dynamic XP Tiers ──────────────────────────────────────────
const HOUR = 3600000;
const DAY = 86400000;

/** Calculate base XP for homework submission based on timing */
export function calculateSubmissionXp(homework: HomeworkAssignment, now: Date = new Date()): number {
  const deadline = homework.deadline.getTime();
  const created = homework.createdAt.getTime();
  const current = now.getTime();
  const timeToDeadline = deadline - current;

  // After deadline
  if (timeToDeadline < 0) return 50;

  // Same day as creation (in the day it was assigned)
  if (current - created < DAY) return 150;

  // 1+ day before deadline
  if (timeToDeadline >= DAY) return 120;

  // 6+ hours before deadline
  if (timeToDeadline >= 6 * HOUR) return 100;

  // On time but less than 6 hours
  return 80;
}

// ─── Early Streak Milestones ────────────────────────────────────
const EARLY_STREAK_MILESTONES = [
  { count: 20, bonus: 1000 },
  { count: 10, bonus: 500 },
  { count: 5, bonus: 200 },
] as const;

function getEarlyStreakMilestoneBonus(streak: number): number {
  for (const milestone of EARLY_STREAK_MILESTONES) {
    if (streak === milestone.count) return milestone.bonus;
  }
  return 0;
}

// ─── Multiplier Tiers ───────────────────────────────────────────
const MULTIPLIER_TIERS = [
  { minStreak: 7, multiplier: 2.0 },
  { minStreak: 3, multiplier: 1.5 },
] as const;

function getMultiplierForStreak(streak: number): number {
  for (const tier of MULTIPLIER_TIERS) {
    if (streak >= tier.minStreak) return tier.multiplier;
  }
  return 1;
}

// ─── Loot Chest ─────────────────────────────────────────────────
const CHEST_CHANCE = 0.3;
const CHEST_MIN_XP = 50;
const CHEST_MAX_XP = 200;

function rollLootChest(): LootChestResult | null {
  if (Math.random() > CHEST_CHANCE) return null;
  const amount = CHEST_MIN_XP + Math.floor(Math.random() * (CHEST_MAX_XP - CHEST_MIN_XP + 1));
  return { type: 'xp', amount };
}

// ─── Achievement Rules ───────────────────────────────────────────
interface AchievementRule {
  target: number;
  calc: (ctx: AchievementContext) => number;
}

interface AchievementContext {
  submittedHomework: number;
  earlyStreak: number;
  duelWins: number;
  completedQuests: number;
  perfectHomework: number;
}

const ACHIEVEMENT_RULES: Record<string, AchievementRule> = {
  'ach-1': { target: 1, calc: (ctx) => ctx.submittedHomework },
  'ach-2': { target: 5, calc: (ctx) => ctx.earlyStreak },
  'ach-3': { target: 10, calc: (ctx) => ctx.earlyStreak },
  'ach-4': { target: 20, calc: (ctx) => ctx.earlyStreak },
  'ach-5': { target: 50, calc: (ctx) => ctx.earlyStreak },
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
  // Lazy imports to break require cycles
  const { useHomeworkStore } = require('../stores/homeworkStore') as typeof import('../stores/homeworkStore');
  const { useArenaStore } = require('../stores/arenaStore') as typeof import('../stores/arenaStore');
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
    earlyStreak: student.earlyStreak,
    duelWins,
    completedQuests,
    perfectHomework,
  };
}

// ─── Reward Functions ────────────────────────────────────────────

export function rewardHomeworkSubmit(homework: HomeworkAssignment): void {
  const { addPoints, incrementEarlyStreak, resetEarlyStreak, updateMascotHealth, setXpMultiplier } = useStudentStore.getState();

  const now = new Date();
  const isOnTime = homework.deadline.getTime() >= now.getTime();

  // 1. Calculate base XP
  const baseXp = calculateSubmissionXp(homework, now);

  // 2. Update early streak
  if (isOnTime) {
    incrementEarlyStreak();
  } else {
    resetEarlyStreak();
  }

  const earlyStreak = useStudentStore.getState().student.earlyStreak;

  // 3. Check milestone bonus
  const milestoneBonus = isOnTime ? getEarlyStreakMilestoneBonus(earlyStreak) : 0;

  // 4. Apply multiplier
  const multiplier = getMultiplierForStreak(earlyStreak);
  setXpMultiplier(multiplier);

  const totalXp = Math.round(baseXp * multiplier) + milestoneBonus;

  // 5. Roll loot chest (only if on time)
  let chestXp = 0;
  if (isOnTime) {
    const chest = rollLootChest();
    if (chest) {
      chestXp = chest.amount;
      useRewardStore.getState().showChest(chest);
    }
  }

  // 6. Award XP and health
  addPoints(totalXp + chestXp);
  updateMascotHealth(isOnTime ? HOMEWORK_SUBMIT_HEALTH : 0);

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
  const { updateMascotHealth, resetEarlyStreak } = useStudentStore.getState();

  updateMascotHealth(MISSED_DEADLINE_HEALTH);
  resetEarlyStreak();
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
